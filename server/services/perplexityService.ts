/**
 * Perplexity AI Service
 * Handles both single-call and multi-part sequential analysis
 * Based on the proven prompts from the original rapid-apollo implementation
 */

import { invokeLLM } from "../_core/llm";
import { Tier, isMultiPartTier, MULTI_PART_CONFIG } from "../../shared/pricing";
import {
  OBSERVER_SYSTEM_PROMPT,
  getObserverPrompt,
  INSIDER_SYSTEM_PROMPT,
  getInsiderInitialPrompt,
  getInsiderContinuePrompt,
  getTierPromptConfig,
  SYNDICATE_SYSTEM_PROMPT,
  SYNDICATE_PART_SCOPES,
  getSyndicateInitialPrompt,
  getSyndicateContinuePrompt,
} from "./tierPromptService";

// ===========================================
// PROMPT INJECTION DEFENSE
// ===========================================

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|rules?|prompts?)/gi,
  /disregard\s+(all\s+)?(previous|above|prior)/gi,
  /forget\s+(everything|all|your)\s+(instructions?|rules?|training)/gi,
  /you\s+are\s+(now|actually|really)\s+(?!analyzing|helping)/gi,
  /act\s+as\s+(?!a\s+helpful)/gi,
  /pretend\s+(to\s+be|you('re)?)/gi,
  /roleplay\s+as/gi,
  /switch\s+to\s+.*\s+mode/gi,
  /what\s+(are|is)\s+your\s+(system\s+)?prompt/gi,
  /show\s+(me\s+)?your\s+(instructions?|prompt|rules)/gi,
  /reveal\s+(your\s+)?(hidden\s+)?instructions?/gi,
  /DAN\s*mode/gi,
  /developer\s+mode/gi,
  /sudo\s+mode/gi,
  /\[JAILBREAK\]/gi,
  /bypass\s+(safety|filter|restriction)/gi,
  /<script[\s>]/gi,
];

function sanitizeInput(input: string): { sanitized: string; flags: string[] } {
  const flags: string[] = [];
  let sanitized = input;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      flags.push(`Pattern: ${pattern.source.slice(0, 20)}...`);
    }
    pattern.lastIndex = 0;
  }

  // Escape delimiters
  sanitized = sanitized
    .replace(/</g, '＜')
    .replace(/>/g, '＞')
    .replace(/\[/g, '［')
    .replace(/\]/g, '］');

  // Remove control characters
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return { sanitized, flags };
}

// ===========================================
// STANDARD TIER PROMPT (Single API Call)
// ===========================================

const STANDARD_PROMPT = (problem: string) => `
═══════════════════════════════════════════════════════════════════
🎯 RAPID UX ANALYSIS - OBSERVER TIER
═══════════════════════════════════════════════════════════════════

You are an expert UX strategist providing a focused analysis for quick validation.

USER PROBLEM/IDEA:
${problem}

═══════════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════

Provide a concise but valuable analysis covering:

## Executive Summary
3-4 sentences summarizing the problem, approach, and expected outcome.

## Problem Analysis
- Core problem identification
- Primary user needs
- Key pain points (top 3)

## Quick Recommendations
- Immediate action items (3-5 bullet points)
- Low-hanging fruit opportunities
- Critical risks to avoid

## Next Steps
- Recommended first action
- Timeline estimate
- Success criteria

Keep the response focused and actionable. Maximum 1,500 tokens.
`;

// ===========================================
// MEDIUM TIER PROMPT (Single API Call, More Depth)
// ===========================================

const MEDIUM_PROMPT = (problem: string) => `
═══════════════════════════════════════════════════════════════════
🔍 COMPREHENSIVE UX ANALYSIS - INSIDER TIER
═══════════════════════════════════════════════════════════════════

You are an expert UX strategist providing comprehensive analysis with strategic insights.

USER PROBLEM/IDEA:
${problem}

═══════════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════

## Executive Summary
4-5 sentences: Problem + Approach + Expected Outcome + Key Differentiator

## Problem Analysis
- **Core Problem:** Deep dive into the fundamental issue
- **Root Causes:** Identify 3-5 underlying causes
- **Impact Areas:** User, Business, Technical implications
- **Jobs-to-be-Done:** What users are trying to accomplish

## User Persona Snapshot
| Attribute | Primary User | Secondary User |
|-----------|--------------|----------------|
| Role | ... | ... |
| Goals | ... | ... |
| Pain Points | ... | ... |
| Success Criteria | ... | ... |

## Strategic Recommendations

### Immediate (24h)
- Action 1 with rationale
- Action 2 with rationale
- Action 3 with rationale

### Short-Term (1 week)
- Priority initiatives
- Quick wins to pursue
- Dependencies to address

### Long-Term (1 month+)
- Strategic initiatives
- Capability building
- Competitive positioning

## Risk Assessment
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Risk 1 | High/Med/Low | High/Med/Low | ... |
| Risk 2 | ... | ... | ... |
| Risk 3 | ... | ... | ... |

## Success Metrics
- North Star Metric
- Leading indicators (3-5)
- Lagging indicators (2-3)

## Key Insight
One powerful insight that could transform the approach.

## Recommended Next Step
Specific, actionable next step with timeline.

Maximum 3,000 tokens. Be thorough but focused.
`;

// ===========================================
// TYPES
// ===========================================
// NOTE: Syndicate tier uses 6-part analysis via tierPromptService.ts
// (SYNDICATE_SYSTEM_PROMPT, SYNDICATE_PART_SCOPES, getSyndicateInitialPrompt, getSyndicateContinuePrompt)

export interface AnalysisCallbacks {
  onChunk?: (partNumber: number, chunk: string) => void;
  onPartComplete?: (partNumber: number, content: string) => void;
  onComplete?: (result: MultiPartResult) => void;
  onError?: (error: Error) => void;
}

export interface SingleAnalysisResult {
  content: string;
  generatedAt: number;
}

export interface MultiPartResult {
  part1: string;
  part2: string;
  part3: string;
  part4: string;
  part5: string;
  part6: string;
  fullMarkdown: string;
  generatedAt: number;
}

export interface InsiderResult {
  part1: string;
  part2: string;
  fullMarkdown: string;
  generatedAt: number;
}

// ===========================================
// MAIN FUNCTIONS
// ===========================================

/**
 * Generate single-call analysis for Standard (Observer) tier
 */
export async function generateSingleAnalysis(
  problemStatement: string,
  tier: "standard" | "medium"
): Promise<SingleAnalysisResult> {
  // Sanitize input
  const { sanitized, flags } = sanitizeInput(problemStatement);

  if (flags.length > 0) {
    console.warn('[Perplexity] Potential prompt injection attempt detected:', flags.length, 'patterns');
  }

  // Use new tier-specific prompts
  const systemPrompt = tier === "standard"
    ? OBSERVER_SYSTEM_PROMPT
    : INSIDER_SYSTEM_PROMPT;

  const userPrompt = tier === "standard"
    ? getObserverPrompt(sanitized)
    : MEDIUM_PROMPT(sanitized); // Medium tier now uses 2-part, but keep fallback

  console.log(`[Perplexity] Generating ${tier} tier analysis`);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: userPrompt
      },
    ],
  });

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : "";

  console.log(`[Perplexity] ${tier} tier analysis completed, length: ${content.length}`);

  return {
    content,
    generatedAt: Date.now(),
  };
}

/**
 * Generate 2-part sequential analysis for Insider (Medium) tier
 * Maintains conversation context across both parts
 */
export async function generateInsiderAnalysis(
  problemStatement: string,
  callbacks?: AnalysisCallbacks
): Promise<InsiderResult> {
  // Sanitize input
  const { sanitized, flags } = sanitizeInput(problemStatement);

  if (flags.length > 0) {
    console.warn('[Perplexity] Potential prompt injection attempt detected:', flags.length, 'patterns');
  }

  const result: InsiderResult = {
    part1: "",
    part2: "",
    fullMarkdown: "",
    generatedAt: 0,
  };

  // RLM Pattern: Base messages (system prompt only) - NOT accumulating full history
  const baseMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: INSIDER_SYSTEM_PROMPT },
  ];

  // STATE_HANDOFF from Part 1 (for Part 2 context)
  let stateHandoffPart1 = "";

  try {
    // Process each of the 2 parts sequentially
    for (let partNum = 1; partNum <= 2; partNum++) {
      console.log(`[Perplexity] Starting Insider Part ${partNum}/2 generation`);

      // RLM Pattern: Build fresh message array for this part
      const messagesForThisPart = [...baseMessages];

      // Part 2: Inject STATE_HANDOFF from Part 1
      if (partNum === 2 && stateHandoffPart1) {
        messagesForThisPart.push({
          role: "user",
          content: `CONTEXT FROM PART 1 (STATE_HANDOFF):\n${stateHandoffPart1}\n\n---\nUSER PROBLEM: ${sanitized}`
        });
      }

      // Build the prompt for this part
      const userPrompt = partNum === 1
        ? getInsiderInitialPrompt(sanitized)
        : getInsiderContinuePrompt(2);

      messagesForThisPart.push({ role: "user", content: userPrompt });

      // Make API call with MINIMAL context (RLM pattern)
      const response = await invokeLLM({
        messages: messagesForThisPart,
      });

      const rawContent = response.choices[0]?.message?.content;
      const partContent = typeof rawContent === "string" ? rawContent : "";

      // Store the result
      if (partNum === 1) {
        result.part1 = partContent;
        // RLM Pattern: Extract STATE_HANDOFF for Part 2
        stateHandoffPart1 = extractStateHandoff(partContent, 1);
        console.log(`[Perplexity] Extracted Insider STATE_HANDOFF, size: ${stateHandoffPart1.length} chars`);
      } else {
        result.part2 = partContent;
      }

      // Notify part completion
      callbacks?.onPartComplete?.(partNum, partContent);

      console.log(`[Perplexity] Completed Insider Part ${partNum}/2, length: ${partContent.length}`);
    }

    // Combine all parts into full markdown
    result.fullMarkdown = [
      "# 🔍 Strategic Blueprint Analysis\n",
      "---\n",
      "## Part 1: Discovery & Problem Analysis\n",
      result.part1,
      "\n---\n",
      "## Part 2: Strategic Design & Roadmap\n",
      result.part2,
    ].join("\n");

    result.generatedAt = Date.now();

    // Notify completion (convert to MultiPartResult format for compatibility)
    if (callbacks?.onComplete) {
      callbacks.onComplete({
        part1: result.part1,
        part2: result.part2,
        part3: "",
        part4: "",
        part5: "",
        part6: "",
        fullMarkdown: result.fullMarkdown,
        generatedAt: result.generatedAt,
      });
    }

    console.log(`[Perplexity] Insider analysis completed, total length: ${result.fullMarkdown.length}`);

    return result;

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Perplexity] Insider analysis failed:", err);
    callbacks?.onError?.(err);
    throw err;
  }
}

/**
 * Generate multi-part sequential analysis for Full/Premium (Syndicate) tier
 * Maintains conversation context across all 6 parts for maximum content quality
 * 
 * 6-Part Structure:
 * - Part 1: Discovery & Problem Analysis (~6,500 tokens)
 * - Part 2: Competitor Deep-Dive (~6,500 tokens) - intensive Perplexity search
 * - Part 3: Strategic Roadmap (~6,500 tokens)
 * - Part 4: 5 Core Design Prompts (~7,500 tokens)
 * - Part 5: 5 Advanced Design Prompts + Edge Cases (~7,500 tokens)
 * - Part 6: Risk, Metrics & ROI (~5,500 tokens)
 * Total: ~40,000 tokens output
 */
export async function generateMultiPartAnalysis(
  problemStatement: string,
  callbacks?: AnalysisCallbacks
): Promise<MultiPartResult> {
  // Sanitize input
  const { sanitized, flags } = sanitizeInput(problemStatement);

  if (flags.length > 0) {
    console.warn('[Perplexity] Potential prompt injection attempt detected:', flags.length, 'patterns');
  }

  const result: MultiPartResult = {
    part1: "",
    part2: "",
    part3: "",
    part4: "",
    part5: "",
    part6: "",
    fullMarkdown: "",
    generatedAt: 0,
  };

  // RLM Pattern: Base messages (system prompt only) - NOT accumulating full history
  const baseMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYNDICATE_SYSTEM_PROMPT },
  ];

  // Accumulated STATE_HANDOFF blocks (not full responses) - the RLM "state" object
  let accumulatedState = "";

  // Part titles for logging and markdown assembly
  const partTitles: Record<number, string> = {
    1: "Discovery & Problem Analysis",
    2: "Competitor Deep-Dive",
    3: "Strategic Roadmap",
    4: "5 Core Design Prompts",
    5: "5 Advanced Design Prompts + Edge Cases",
    6: "Risk, Metrics & Strategic Rationale",
  };

  try {
    // Process each of the 6 parts sequentially
    for (let partNum = 1; partNum <= 6; partNum++) {
      console.log(`[Perplexity] Starting Syndicate Part ${partNum}/6: ${partTitles[partNum]}`);

      // RLM Pattern: Build fresh message array for this part (not accumulating full history)
      const messagesForThisPart = [...baseMessages];

      // Inject accumulated STATE_HANDOFF as context (if any previous parts completed)
      if (accumulatedState) {
        messagesForThisPart.push({
          role: "user",
          content: `CONTEXT FROM PREVIOUS PARTS (STATE_HANDOFF blocks):\n${accumulatedState}\n\n---\nUSER PROBLEM: ${sanitized}`
        });
      }

      // Build the prompt for this part using Syndicate-specific prompts
      const userPrompt = partNum === 1
        ? getSyndicateInitialPrompt(sanitized)
        : getSyndicateContinuePrompt(partNum, ""); // Context now comes from accumulatedState above

      messagesForThisPart.push({ role: "user", content: userPrompt });

      // Make API call with MINIMAL context (RLM pattern - not full history)
      const response = await invokeLLM({
        messages: messagesForThisPart,
      });

      const rawContent = response.choices[0]?.message?.content;
      const partContent = typeof rawContent === "string" ? rawContent : "";

      // Store the FULL result (user still gets everything)
      const partKey = `part${partNum}` as keyof Pick<MultiPartResult, "part1" | "part2" | "part3" | "part4" | "part5" | "part6">;
      result[partKey] = partContent;

      // RLM Pattern: Extract and accumulate ONLY the STATE_HANDOFF, not full response
      // This is the key difference from traditional conversation history
      if (partNum < 6) { // No need to extract state from final part
        const stateHandoff = extractStateHandoff(partContent, partNum);
        accumulatedState += `\n\n${stateHandoff}`;
        console.log(`[Perplexity] Accumulated state size: ${accumulatedState.length} chars`);
      }

      // Notify part completion
      callbacks?.onPartComplete?.(partNum, partContent);

      console.log(`[Perplexity] Completed Syndicate Part ${partNum}/6, length: ${partContent.length}`);
    }

    // Combine all 6 parts into full markdown
    result.fullMarkdown = [
      "# 🔥 APEX Strategic Analysis - Syndicate Tier\n",
      "---\n",
      `## Part 1: ${partTitles[1]}\n`,
      result.part1,
      "\n---\n",
      `## Part 2: ${partTitles[2]}\n`,
      result.part2,
      "\n---\n",
      `## Part 3: ${partTitles[3]}\n`,
      result.part3,
      "\n---\n",
      `## Part 4: ${partTitles[4]}\n`,
      result.part4,
      "\n---\n",
      `## Part 5: ${partTitles[5]}\n`,
      result.part5,
      "\n---\n",
      `## Part 6: ${partTitles[6]}\n`,
      result.part6,
    ].join("\n");

    result.generatedAt = Date.now();

    // Notify completion
    callbacks?.onComplete?.(result);

    console.log(`[Perplexity] Syndicate 6-part analysis completed, total length: ${result.fullMarkdown.length}`);

    return result;

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[Perplexity] Syndicate multi-part analysis failed:", err);
    callbacks?.onError?.(err);
    throw err;
  }
}

/**
 * Extract STATE_HANDOFF block from a completed part's output
 * RLM Pattern: Returns structured state instead of full response for memory efficiency
 * 
 * Priority:
 * 1. Explicit STATE_HANDOFF JSON block (preferred)
 * 2. Key Findings Summary section (fallback)
 * 3. First 400 chars of content (last resort)
 */
function extractStateHandoff(partContent: string, partNum: number): string {
  // Try to find explicit STATE_HANDOFF block
  const stateHandoffPattern = /```json\s*\/\/\s*STATE_HANDOFF_PART_\d[\s\S]*?```/i;
  const match = partContent.match(stateHandoffPattern);

  if (match) {
    console.log(`[Perplexity] Extracted explicit STATE_HANDOFF for Part ${partNum}`);
    return match[0];
  }

  // Fallback: Extract Key Findings Summary section
  console.warn(`[Perplexity] No explicit STATE_HANDOFF found for Part ${partNum}, using fallback extraction`);
  const summaryMatch = partContent.match(/## (?:Key Findings Summary|Summary|Roadmap Summary|Competitor Intelligence Summary)[\s\S]*?(?=\n## |\n\[✅|$)/i);

  if (summaryMatch) {
    return `// STATE_HANDOFF_PART_${partNum} (auto-extracted from summary)\n${summaryMatch[0].substring(0, 600)}`;
  }

  // Last resort: first 400 chars
  return `// STATE_HANDOFF_PART_${partNum} (auto-extracted, no summary found)\n${partContent.substring(0, 400)}...`;
}

/**
 * Extract summary from previous parts to provide context for subsequent parts
 * @deprecated Use extractStateHandoff instead for RLM pattern
 */
function extractPreviousSummary(result: MultiPartResult, upToPart: number): string {
  const summaries: string[] = [];

  // Extract key findings from each completed part
  const partKeys = ['part1', 'part2', 'part3', 'part4', 'part5'] as const;
  const partDescriptions = [
    'Discovery & Problem Analysis',
    'Competitor Deep-Dive',
    'Strategic Roadmap',
    'Core Design Prompts',
    'Advanced Design Prompts',
  ];

  for (let i = 0; i < upToPart && i < partKeys.length; i++) {
    const partContent = result[partKeys[i]];
    if (partContent) {
      // Extract the summary section if it exists, otherwise use first 500 chars
      const summaryMatch = partContent.match(/## (?:Key Findings Summary|Summary|Roadmap Summary|Competitor Intelligence Summary)[\s\S]*?(?=\n## |\n\[✅|$)/i);
      const summary = summaryMatch
        ? summaryMatch[0].substring(0, 600)
        : partContent.substring(0, 400) + '...';
      summaries.push(`**Part ${i + 1} (${partDescriptions[i]}):**\n${summary}`);
    }
  }

  return summaries.join('\n\n');
}

/**
 * Generate analysis based on tier
 * - Observer (standard): Single-part quick validation (~3,000 tokens)
 * - Insider (medium): 2-part strategic blueprint (~10,000 tokens)
 * - Syndicate (full): 6-part comprehensive APEX analysis (~40,000 tokens)
 */
export async function generateAnalysis(
  problemStatement: string,
  tier: Tier,
  callbacks?: AnalysisCallbacks
): Promise<SingleAnalysisResult | MultiPartResult | InsiderResult> {
  console.log(`[Perplexity] Starting ${tier} tier analysis`);

  switch (tier) {
    case "standard":
      // Observer tier: Single-part quick validation
      return generateSingleAnalysis(problemStatement, "standard");

    case "medium":
      // Insider tier: 2-part strategic blueprint
      return generateInsiderAnalysis(problemStatement, callbacks);

    case "full":
      // Syndicate tier: 6-part comprehensive APEX analysis
      return generateMultiPartAnalysis(problemStatement, callbacks);

    default:
      console.warn(`[Perplexity] Unknown tier: ${tier}, falling back to standard`);
      return generateSingleAnalysis(problemStatement, "standard");
  }
}
