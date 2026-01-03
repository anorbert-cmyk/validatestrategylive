/**
 * Graceful Degradation Module
 * 
 * Handles partial failures and provides degraded but usable results when
 * full analysis cannot be completed. This ensures users always receive
 * value even when some parts fail.
 * 
 * Degradation Strategy by Tier:
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                    GRACEFUL DEGRADATION MATRIX                          │
 * ├─────────────┬──────────────┬─────────────────┬─────────────────────────┤
 * │    Tier     │ Total Parts  │ Min for Success │ Degradation Action      │
 * ├─────────────┼──────────────┼─────────────────┼─────────────────────────┤
 * │  Observer   │      1       │       1         │ Full retry or refund    │
 * │  Insider    │      2       │       1         │ Partial + retry Part 2  │
 * │  Syndicate  │      6       │       4         │ Partial + retry missing │
 * └─────────────┴──────────────┴─────────────────┴─────────────────────────┘
 * 
 * When degradation occurs:
 * 1. Save completed parts immediately
 * 2. Generate placeholder content for missing parts
 * 3. Queue missing parts for background retry
 * 4. Notify user of partial completion
 * 5. Track for potential refund eligibility
 */

import { Tier } from "../../shared/pricing";
import {
  AnalysisError,
  PartialFailureError,
  TIER_ERROR_CONFIGS,
  ErrorContext,
} from "./errorHandling";
import { retryQueue } from "./retryStrategy";

// ============================================================================
// TYPES
// ============================================================================

export interface PartResult {
  partNumber: number;
  content: string;
  generatedAt: Date;
  isPlaceholder: boolean;
  retryScheduled?: boolean;
}

export interface DegradedAnalysisResult {
  /** Session identifier */
  sessionId: string;
  /** Analysis tier */
  tier: Tier;
  /** Successfully completed parts */
  completedParts: PartResult[];
  /** Failed parts with placeholders */
  failedParts: PartResult[];
  /** Combined markdown (with placeholders for missing) */
  fullMarkdown: string;
  /** Percentage of completion */
  completionPercentage: number;
  /** Whether result meets minimum threshold */
  meetsMinimumThreshold: boolean;
  /** Whether user is eligible for partial refund */
  eligibleForPartialRefund: boolean;
  /** Retry IDs for failed parts */
  retryIds: string[];
  /** Timestamp */
  generatedAt: Date;
}

export interface PartPlaceholder {
  partNumber: number;
  title: string;
  content: string;
}

// ============================================================================
// PART DEFINITIONS BY TIER
// ============================================================================

const PART_DEFINITIONS: Record<Tier, Array<{ number: number; title: string; description: string }>> = {
  standard: [
    {
      number: 1,
      title: "Quick Validation Analysis",
      description: "Problem statement analysis, viability assessment, and key recommendations",
    },
  ],
  medium: [
    {
      number: 1,
      title: "Discovery & Problem Analysis",
      description: "Deep dive into the problem space, user pain points, and market context",
    },
    {
      number: 2,
      title: "Strategic Roadmap",
      description: "Actionable recommendations, prioritized features, and implementation guidance",
    },
  ],
  full: [
    {
      number: 1,
      title: "Discovery & Problem Analysis",
      description: "Comprehensive problem space analysis with verified research",
    },
    {
      number: 2,
      title: "Competitor Deep-Dive",
      description: "Detailed competitive landscape analysis with real-time market data",
    },
    {
      number: 3,
      title: "Strategic Roadmap",
      description: "Phased implementation plan with prioritized features",
    },
    {
      number: 4,
      title: "Core Design Prompts",
      description: "5 foundational UX/UI design prompts for Figma",
    },
    {
      number: 5,
      title: "Advanced Design Prompts",
      description: "5 advanced design prompts plus edge case handling",
    },
    {
      number: 6,
      title: "Risk, Metrics & Strategic Rationale",
      description: "ROI calculations, risk assessment, and success metrics",
    },
  ],
};

// ============================================================================
// PLACEHOLDER GENERATION
// ============================================================================

/**
 * Generate placeholder content for a failed part
 */
function generatePlaceholder(tier: Tier, partNumber: number): PartPlaceholder {
  const partDef = PART_DEFINITIONS[tier].find((p) => p.number === partNumber);
  
  if (!partDef) {
    return {
      partNumber,
      title: `Part ${partNumber}`,
      content: `
## Part ${partNumber} - Processing

This section is currently being regenerated. You will be notified when it's ready.

---

*If this section doesn't update within 30 minutes, please contact support.*
`,
    };
  }

  return {
    partNumber,
    title: partDef.title,
    content: `
## ${partDef.title}

> ⏳ **This section is being regenerated**
>
> ${partDef.description}

We encountered a temporary issue generating this section. Our system is automatically retrying.

### What to expect:
- This section will be automatically updated when ready
- You'll receive an email notification upon completion
- Typical retry time: 5-15 minutes

### In the meantime:
- You can review the completed sections below
- Your analysis is saved and won't be lost
- No action is required from you

---

*Section ID: PART-${partNumber}-PENDING | Retry scheduled*
`,
  };
}

/**
 * Generate a summary placeholder when multiple parts fail
 */
function generateSummaryPlaceholder(
  tier: Tier,
  failedParts: number[],
  completedParts: number[]
): string {
  const totalParts = TIER_ERROR_CONFIGS[tier].expectedParts;
  const completionPct = Math.round((completedParts.length / totalParts) * 100);

  return `
---

## ⚠️ Partial Analysis Notice

Your analysis is **${completionPct}% complete**. Some sections are being regenerated.

| Status | Sections |
|--------|----------|
| ✅ Completed | ${completedParts.map((p) => `Part ${p}`).join(", ") || "None"} |
| ⏳ Processing | ${failedParts.map((p) => `Part ${p}`).join(", ")} |

### What happens next:
1. Our system is automatically retrying the missing sections
2. You'll receive an email when everything is ready
3. This page will update automatically

### Need help?
If your analysis isn't complete within 30 minutes, please contact support with your session ID.

---
`;
}

// ============================================================================
// DEGRADATION HANDLER
// ============================================================================

/**
 * Handle partial analysis failure with graceful degradation
 */
export async function handlePartialFailure(
  sessionId: string,
  tier: Tier,
  completedResults: Map<number, string>,
  failedParts: number[],
  errors: Map<number, AnalysisError>,
  context: Partial<ErrorContext> = {}
): Promise<DegradedAnalysisResult> {
  const config = TIER_ERROR_CONFIGS[tier];
  const totalParts = config.expectedParts;
  const completedCount = completedResults.size;
  const completionPercentage = Math.round((completedCount / totalParts) * 100);
  const meetsMinimum = completedCount >= config.minPartsForPartialSuccess;

  // Generate completed parts
  const completedParts: PartResult[] = [];
  completedResults.forEach((content, partNum) => {
    completedParts.push({
      partNumber: partNum,
      content,
      generatedAt: new Date(),
      isPlaceholder: false,
    });
  });

  // Generate placeholders and queue retries for failed parts
  const failedPartsResults: PartResult[] = [];
  const retryIds: string[] = [];

  for (const partNum of failedParts) {
    const placeholder = generatePlaceholder(tier, partNum);
    
    // Queue for retry
    const retryId = retryQueue.enqueue({
      sessionId,
      tier,
      operation: `regenerate_part_${partNum}`,
      priority: config.retryPriority,
      scheduledFor: new Date(Date.now() + 30000), // 30 seconds from now
      attempts: 0,
      lastError: errors.get(partNum)?.message,
    });

    retryIds.push(retryId);

    failedPartsResults.push({
      partNumber: partNum,
      content: placeholder.content,
      generatedAt: new Date(),
      isPlaceholder: true,
      retryScheduled: true,
    });
  }

  // Build full markdown with placeholders
  const allParts = [...completedParts, ...failedPartsResults].sort(
    (a, b) => a.partNumber - b.partNumber
  );

  let fullMarkdown = "";
  
  // Add summary notice if there are failures
  if (failedParts.length > 0) {
    fullMarkdown += generateSummaryPlaceholder(
      tier,
      failedParts,
      Array.from(completedResults.keys())
    );
  }

  // Add all parts
  for (const part of allParts) {
    fullMarkdown += part.content + "\n\n";
  }

  // Determine refund eligibility
  // Eligible if less than minimum threshold OR if high-value tier with significant failure
  const eligibleForPartialRefund =
    !meetsMinimum ||
    (tier === "full" && failedParts.length >= 3);

  const result: DegradedAnalysisResult = {
    sessionId,
    tier,
    completedParts,
    failedParts: failedPartsResults,
    fullMarkdown,
    completionPercentage,
    meetsMinimumThreshold: meetsMinimum,
    eligibleForPartialRefund,
    retryIds,
    generatedAt: new Date(),
  };

  console.log(
    `[GracefulDegradation] Session ${sessionId}: ${completionPercentage}% complete, ` +
    `${failedParts.length} parts queued for retry, refund eligible: ${eligibleForPartialRefund}`
  );

  return result;
}

// ============================================================================
// RECOVERY FUNCTIONS
// ============================================================================

/**
 * Update a degraded result when a retry succeeds
 */
export function updateDegradedResult(
  currentResult: DegradedAnalysisResult,
  partNumber: number,
  newContent: string
): DegradedAnalysisResult {
  // Find and update the failed part
  const failedIndex = currentResult.failedParts.findIndex(
    (p) => p.partNumber === partNumber
  );

  if (failedIndex === -1) {
    console.warn(`[GracefulDegradation] Part ${partNumber} not found in failed parts`);
    return currentResult;
  }

  // Move from failed to completed
  const updatedPart: PartResult = {
    partNumber,
    content: newContent,
    generatedAt: new Date(),
    isPlaceholder: false,
  };

  const newCompletedParts = [...currentResult.completedParts, updatedPart];
  const newFailedParts = currentResult.failedParts.filter(
    (p) => p.partNumber !== partNumber
  );

  // Recalculate metrics
  const config = TIER_ERROR_CONFIGS[currentResult.tier];
  const totalParts = config.expectedParts;
  const completionPercentage = Math.round(
    (newCompletedParts.length / totalParts) * 100
  );
  const meetsMinimum = newCompletedParts.length >= config.minPartsForPartialSuccess;

  // Rebuild markdown
  const allParts = [...newCompletedParts, ...newFailedParts].sort(
    (a, b) => a.partNumber - b.partNumber
  );

  let fullMarkdown = "";
  
  if (newFailedParts.length > 0) {
    fullMarkdown += generateSummaryPlaceholder(
      currentResult.tier,
      newFailedParts.map((p) => p.partNumber),
      newCompletedParts.map((p) => p.partNumber)
    );
  }

  for (const part of allParts) {
    fullMarkdown += part.content + "\n\n";
  }

  // Update refund eligibility
  const eligibleForPartialRefund =
    !meetsMinimum ||
    (currentResult.tier === "full" && newFailedParts.length >= 3);

  return {
    ...currentResult,
    completedParts: newCompletedParts,
    failedParts: newFailedParts,
    fullMarkdown,
    completionPercentage,
    meetsMinimumThreshold: meetsMinimum,
    eligibleForPartialRefund,
    generatedAt: new Date(),
  };
}

/**
 * Check if a degraded result is now complete
 */
export function isDegradedResultComplete(result: DegradedAnalysisResult): boolean {
  return result.failedParts.length === 0;
}

/**
 * Get recovery status for a session
 */
export function getRecoveryStatus(result: DegradedAnalysisResult): {
  status: "complete" | "partial" | "critical";
  message: string;
  pendingParts: number[];
  estimatedCompletion: Date | null;
} {
  if (isDegradedResultComplete(result)) {
    return {
      status: "complete",
      message: "Your analysis is complete!",
      pendingParts: [],
      estimatedCompletion: null,
    };
  }

  const pendingParts = result.failedParts.map((p) => p.partNumber);
  const estimatedMinutes = pendingParts.length * 5; // ~5 min per part
  const estimatedCompletion = new Date(Date.now() + estimatedMinutes * 60000);

  if (result.meetsMinimumThreshold) {
    return {
      status: "partial",
      message: `Your analysis is ${result.completionPercentage}% complete. Remaining sections are being processed.`,
      pendingParts,
      estimatedCompletion,
    };
  }

  return {
    status: "critical",
    message: "We're experiencing issues completing your analysis. Our team has been notified.",
    pendingParts,
    estimatedCompletion,
  };
}

// ============================================================================
// FALLBACK CONTENT
// ============================================================================

/**
 * Generate minimal fallback content when all retries fail
 * This ensures the user gets SOMETHING even in worst case
 */
export function generateFallbackContent(
  tier: Tier,
  problemStatement: string
): string {
  const preview = problemStatement.substring(0, 200);
  
  return `
# Analysis Report

## Your Problem Statement
> ${preview}${problemStatement.length > 200 ? "..." : ""}

---

## ⚠️ Service Interruption Notice

We apologize, but we were unable to complete your analysis due to a technical issue.

### What happened:
Our AI analysis service experienced an unexpected interruption while processing your request.

### What we're doing:
- Our technical team has been automatically notified
- We're working to resolve the issue
- Your payment is being reviewed for a full refund

### Next steps:
1. **Check your email** - We'll send an update within 24 hours
2. **Contact support** - If you need immediate assistance
3. **Retry later** - The issue may be temporary

### Your options:
- **Full refund**: Available if we can't complete your analysis within 24 hours
- **Priority retry**: We'll prioritize your analysis once the issue is resolved

---

*We sincerely apologize for the inconvenience. Your satisfaction is our priority.*

**Support contact**: support@validatestrategy.com
**Session ID**: Please include this when contacting support
`;
}
