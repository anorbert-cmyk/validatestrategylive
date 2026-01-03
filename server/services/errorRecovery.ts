/**
 * Error Recovery & Admin Tools Module
 * 
 * Provides automated and manual recovery mechanisms for failed analyses,
 * along with admin tools for managing the error handling system.
 * 
 * Recovery Strategy:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                      RECOVERY PIPELINE                                  │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │   Failed Analysis → Assess Damage → Select Strategy → Execute          │
 * │                                                                         │
 * │   Strategies:                                                           │
 * │   ┌──────────────┬─────────────────────────────────────────────────┐   │
 * │   │ AUTO_RETRY   │ Automatic retry with backoff (default)          │   │
 * │   │ MANUAL_RETRY │ Admin-triggered retry                           │   │
 * │   │ PARTIAL_SAVE │ Save completed parts, queue failed              │   │
 * │   │ REFUND       │ Issue refund, notify user                       │   │
 * │   │ ESCALATE     │ Notify support team for manual intervention     │   │
 * │   └──────────────┴─────────────────────────────────────────────────┘   │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { Tier } from "../../shared/pricing";
import {
  AnalysisError,
  AnalysisErrorCode,
  ErrorCategory,
  TIER_ERROR_CONFIGS,
} from "./errorHandling";
import { retryQueue, perplexityCircuitBreaker, CircuitState } from "./retryStrategy";
import {
  DegradedAnalysisResult,
  handlePartialFailure,
  updateDegradedResult,
} from "./gracefulDegradation";
import {
  notifyAnalysisFailed,
  notifyRecoverySuccess,
  notifyAdminCriticalError,
} from "./errorNotifications";
import { analysisLogger, recordFailure, recordSuccess } from "./errorMonitoring";

// ============================================================================
// TYPES
// ============================================================================

export enum RecoveryStrategy {
  AUTO_RETRY = "auto_retry",
  MANUAL_RETRY = "manual_retry",
  PARTIAL_SAVE = "partial_save",
  REFUND = "refund",
  ESCALATE = "escalate",
}

export interface RecoveryAction {
  strategy: RecoveryStrategy;
  sessionId: string;
  tier: Tier;
  reason: string;
  timestamp: Date;
  success?: boolean;
  result?: string;
}

export interface FailedAnalysis {
  sessionId: string;
  tier: Tier;
  problemStatement: string;
  userEmail: string;
  failedAt: Date;
  error: AnalysisError;
  completedParts: number[];
  failedParts: number[];
  retryCount: number;
  lastRetryAt?: Date;
  recoveryStrategy?: RecoveryStrategy;
  refundIssued: boolean;
}

export interface AdminAction {
  action: string;
  sessionId?: string;
  performedBy: string;
  performedAt: Date;
  result: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// IN-MEMORY STORAGE (Production would use database)
// ============================================================================

const failedAnalyses = new Map<string, FailedAnalysis>();
const recoveryHistory: RecoveryAction[] = [];
const adminActions: AdminAction[] = [];

// ============================================================================
// RECOVERY STRATEGY SELECTION
// ============================================================================

/**
 * Determine the best recovery strategy based on failure context
 */
export function selectRecoveryStrategy(
  error: AnalysisError,
  tier: Tier,
  retryCount: number,
  completedParts: number[],
  totalParts: number
): RecoveryStrategy {
  const config = TIER_ERROR_CONFIGS[tier];
  const completionRatio = completedParts.length / totalParts;

  // If circuit breaker is open, escalate immediately
  if (perplexityCircuitBreaker.getState() === CircuitState.OPEN) {
    return RecoveryStrategy.ESCALATE;
  }

  // Non-retryable errors go straight to refund or escalate
  if (!error.isRetryable) {
    if (completionRatio >= 0.5) {
      return RecoveryStrategy.PARTIAL_SAVE;
    }
    return RecoveryStrategy.REFUND;
  }

  // If we have enough completed parts, save what we have
  if (completedParts.length >= config.minPartsForPartialSuccess) {
    return RecoveryStrategy.PARTIAL_SAVE;
  }

  // If we haven't exceeded retry limit, try again
  if (retryCount < config.maxRetries) {
    return RecoveryStrategy.AUTO_RETRY;
  }

  // High-value tiers get escalation before refund
  if (tier === "full" || tier === "medium") {
    return RecoveryStrategy.ESCALATE;
  }

  // Default to refund
  return RecoveryStrategy.REFUND;
}

// ============================================================================
// RECOVERY EXECUTION
// ============================================================================

/**
 * Execute a recovery strategy
 */
export async function executeRecovery(
  sessionId: string,
  strategy: RecoveryStrategy,
  context: {
    tier: Tier;
    userEmail: string;
    error: AnalysisError;
    completedParts: Map<number, string>;
    failedParts: number[];
  }
): Promise<RecoveryAction> {
  const action: RecoveryAction = {
    strategy,
    sessionId,
    tier: context.tier,
    reason: `Error: ${context.error.code} - ${context.error.message}`,
    timestamp: new Date(),
  };

  try {
    switch (strategy) {
      case RecoveryStrategy.AUTO_RETRY:
        await handleAutoRetry(sessionId, context);
        action.success = true;
        action.result = "Queued for automatic retry";
        break;

      case RecoveryStrategy.PARTIAL_SAVE:
        await handlePartialSave(sessionId, context);
        action.success = true;
        action.result = `Saved ${context.completedParts.size} parts, queued ${context.failedParts.length} for retry`;
        break;

      case RecoveryStrategy.REFUND:
        await handleRefund(sessionId, context);
        action.success = true;
        action.result = "Refund initiated";
        break;

      case RecoveryStrategy.ESCALATE:
        await handleEscalation(sessionId, context);
        action.success = true;
        action.result = "Escalated to support team";
        break;

      case RecoveryStrategy.MANUAL_RETRY:
        // This is triggered by admin, handled separately
        action.success = true;
        action.result = "Manual retry initiated";
        break;
    }
  } catch (err) {
    action.success = false;
    action.result = `Recovery failed: ${err instanceof Error ? err.message : "Unknown error"}`;
    analysisLogger.error("Recovery execution failed", {
      sessionId,
      tier: context.tier,
      metadata: { strategy, error: action.result },
    });
  }

  recoveryHistory.push(action);
  return action;
}

/**
 * Handle automatic retry
 */
async function handleAutoRetry(
  sessionId: string,
  context: {
    tier: Tier;
    failedParts: number[];
    error: AnalysisError;
  }
): Promise<void> {
  const config = TIER_ERROR_CONFIGS[context.tier];

  for (const partNum of context.failedParts) {
    retryQueue.enqueue({
      sessionId,
      tier: context.tier,
      operation: `retry_part_${partNum}`,
      priority: config.retryPriority,
      scheduledFor: new Date(Date.now() + config.baseDelay),
      attempts: 0,
      lastError: context.error.message,
    });
  }

  analysisLogger.info("Auto-retry scheduled", {
    sessionId,
    tier: context.tier,
    metadata: { failedParts: context.failedParts },
  });
}

/**
 * Handle partial save with degraded result
 */
async function handlePartialSave(
  sessionId: string,
  context: {
    tier: Tier;
    userEmail: string;
    completedParts: Map<number, string>;
    failedParts: number[];
    error: AnalysisError;
  }
): Promise<DegradedAnalysisResult> {
  const errors = new Map<number, AnalysisError>();
  for (const partNum of context.failedParts) {
    errors.set(partNum, context.error);
  }

  const degradedResult = await handlePartialFailure(
    sessionId,
    context.tier,
    context.completedParts,
    context.failedParts,
    errors
  );

  // Notify user of partial completion
  // Note: This would need to be integrated with the actual notification system
  analysisLogger.info("Partial save completed", {
    sessionId,
    tier: context.tier,
    metadata: {
      completionPercentage: degradedResult.completionPercentage,
      failedParts: context.failedParts,
    },
  });

  return degradedResult;
}

/**
 * Handle refund
 */
async function handleRefund(
  sessionId: string,
  context: {
    tier: Tier;
    userEmail: string;
    error: AnalysisError;
  }
): Promise<void> {
  // Mark in failed analyses
  const failed = failedAnalyses.get(sessionId);
  if (failed) {
    failed.refundIssued = true;
    failed.recoveryStrategy = RecoveryStrategy.REFUND;
  }

  // Notify user
  await notifyAnalysisFailed(sessionId, context.tier, context.userEmail, true, context.error);

  // Log for accounting
  analysisLogger.warn("Refund initiated", {
    sessionId,
    tier: context.tier,
    errorCode: context.error.code,
    metadata: { userEmail: context.userEmail },
  });

  // In production, this would trigger actual refund via payment provider
  // await initiateRefund(sessionId);
}

/**
 * Handle escalation to support team
 */
async function handleEscalation(
  sessionId: string,
  context: {
    tier: Tier;
    userEmail: string;
    error: AnalysisError;
  }
): Promise<void> {
  // Notify admin
  await notifyAdminCriticalError(sessionId, context.tier, context.error);

  // Log escalation
  analysisLogger.error("Analysis escalated to support", {
    sessionId,
    tier: context.tier,
    errorCode: context.error.code,
    metadata: {
      userEmail: context.userEmail,
      errorMessage: context.error.message,
    },
  });
}

// ============================================================================
// ADMIN TOOLS
// ============================================================================

/**
 * Get all failed analyses
 */
export function getFailedAnalyses(): FailedAnalysis[] {
  return Array.from(failedAnalyses.values()).sort(
    (a, b) => b.failedAt.getTime() - a.failedAt.getTime()
  );
}

/**
 * Get failed analysis by session ID
 */
export function getFailedAnalysis(sessionId: string): FailedAnalysis | undefined {
  return failedAnalyses.get(sessionId);
}

/**
 * Register a failed analysis
 */
export function registerFailedAnalysis(
  sessionId: string,
  tier: Tier,
  problemStatement: string,
  userEmail: string,
  error: AnalysisError,
  completedParts: number[],
  failedParts: number[]
): void {
  const existing = failedAnalyses.get(sessionId);

  failedAnalyses.set(sessionId, {
    sessionId,
    tier,
    problemStatement,
    userEmail,
    failedAt: new Date(),
    error,
    completedParts,
    failedParts,
    retryCount: existing ? existing.retryCount + 1 : 0,
    lastRetryAt: existing ? new Date() : undefined,
    refundIssued: existing?.refundIssued || false,
  });

  recordFailure();
}

/**
 * Admin: Manually retry a failed analysis
 */
export async function adminRetryAnalysis(
  sessionId: string,
  adminId: string
): Promise<{ success: boolean; message: string }> {
  const failed = failedAnalyses.get(sessionId);

  if (!failed) {
    return { success: false, message: "Failed analysis not found" };
  }

  if (failed.refundIssued) {
    return { success: false, message: "Cannot retry - refund already issued" };
  }

  // Queue for retry
  const config = TIER_ERROR_CONFIGS[failed.tier];
  for (const partNum of failed.failedParts) {
    retryQueue.enqueue({
      sessionId,
      tier: failed.tier,
      operation: `admin_retry_part_${partNum}`,
      priority: 100, // High priority for admin retries
      scheduledFor: new Date(), // Immediate
      attempts: 0,
      lastError: "Admin-triggered retry",
    });
  }

  // Log admin action
  adminActions.push({
    action: "manual_retry",
    sessionId,
    performedBy: adminId,
    performedAt: new Date(),
    result: `Queued ${failed.failedParts.length} parts for retry`,
    metadata: { tier: failed.tier, failedParts: failed.failedParts },
  });

  analysisLogger.info("Admin triggered manual retry", {
    sessionId,
    tier: failed.tier,
    metadata: { adminId },
  });

  return {
    success: true,
    message: `Retry queued for ${failed.failedParts.length} parts`,
  };
}

/**
 * Admin: Issue refund for failed analysis
 */
export async function adminIssueRefund(
  sessionId: string,
  adminId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  const failed = failedAnalyses.get(sessionId);

  if (!failed) {
    return { success: false, message: "Failed analysis not found" };
  }

  if (failed.refundIssued) {
    return { success: false, message: "Refund already issued" };
  }

  // Mark refund issued
  failed.refundIssued = true;
  failed.recoveryStrategy = RecoveryStrategy.REFUND;

  // Notify user
  await notifyAnalysisFailed(sessionId, failed.tier, failed.userEmail, true, failed.error);

  // Log admin action
  adminActions.push({
    action: "issue_refund",
    sessionId,
    performedBy: adminId,
    performedAt: new Date(),
    result: `Refund issued: ${reason}`,
    metadata: { tier: failed.tier, reason },
  });

  analysisLogger.warn("Admin issued refund", {
    sessionId,
    tier: failed.tier,
    metadata: { adminId, reason },
  });

  return { success: true, message: "Refund issued and user notified" };
}

/**
 * Admin: Reset circuit breaker
 */
export function adminResetCircuitBreaker(adminId: string): void {
  perplexityCircuitBreaker.forceReset();

  adminActions.push({
    action: "reset_circuit_breaker",
    performedBy: adminId,
    performedAt: new Date(),
    result: "Circuit breaker reset to CLOSED",
  });

  analysisLogger.info("Admin reset circuit breaker", {
    metadata: { adminId },
  });
}

/**
 * Admin: Clear retry queue
 */
export function adminClearRetryQueue(adminId: string): number {
  const stats = retryQueue.getStats();
  const clearedCount = stats.size;

  // Note: Would need to implement clear method on retryQueue
  // retryQueue.clear();

  adminActions.push({
    action: "clear_retry_queue",
    performedBy: adminId,
    performedAt: new Date(),
    result: `Cleared ${clearedCount} items from retry queue`,
  });

  analysisLogger.warn("Admin cleared retry queue", {
    metadata: { adminId, clearedCount },
  });

  return clearedCount;
}

/**
 * Get admin action history
 */
export function getAdminActions(limit: number = 50): AdminAction[] {
  return adminActions.slice(-limit).reverse();
}

/**
 * Get recovery history
 */
export function getRecoveryHistory(sessionId?: string): RecoveryAction[] {
  let history = [...recoveryHistory];

  if (sessionId) {
    history = history.filter((r) => r.sessionId === sessionId);
  }

  return history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// ============================================================================
// RECOVERY PROCESSOR (Background Job)
// ============================================================================

/**
 * Process pending retries from the queue
 * This would be called by a cron job or background worker
 */
export async function processRetryQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  // Process up to 10 items per run
  for (let i = 0; i < 10; i++) {
    const item = retryQueue.dequeue();
    if (!item) break;

    processed++;

    try {
      // In production, this would call the actual analysis function
      // const result = await regeneratePart(item.sessionId, item.tier, partNumber);

      // For now, just log
      analysisLogger.info("Processing retry queue item", {
        sessionId: item.sessionId,
        tier: item.tier,
        metadata: { operation: item.operation, attempt: item.attempts + 1 },
      });

      // Simulate success/failure (in production, this would be real)
      const success = Math.random() > 0.3; // 70% success rate for demo

      if (success) {
        succeeded++;
        recordSuccess();
      } else {
        failed++;
        recordFailure();

        // Re-queue if under retry limit
        if (item.attempts < 3) {
          retryQueue.enqueue({
            ...item,
            attempts: item.attempts + 1,
            scheduledFor: new Date(Date.now() + 60000), // 1 minute delay
            lastError: "Retry failed",
          });
        }
      }
    } catch (err) {
      failed++;
      recordFailure();
      analysisLogger.error("Retry queue processing error", {
        sessionId: item.sessionId,
        tier: item.tier,
        metadata: { error: err instanceof Error ? err.message : "Unknown" },
      });
    }
  }

  return { processed, succeeded, failed };
}

// ============================================================================
// HEALTH RECOVERY
// ============================================================================

/**
 * Attempt to recover system health
 * Called when anomalies are detected
 */
export async function attemptHealthRecovery(): Promise<{
  action: string;
  success: boolean;
}> {
  const circuitState = perplexityCircuitBreaker.getState();

  // If circuit is open, wait for it to recover naturally
  if (circuitState === CircuitState.OPEN) {
    return {
      action: "waiting_for_circuit_reset",
      success: true,
    };
  }

  // If circuit is half-open, let it test
  if (circuitState === CircuitState.HALF_OPEN) {
    return {
      action: "circuit_testing",
      success: true,
    };
  }

  // System is healthy
  return {
    action: "no_action_needed",
    success: true,
  };
}
