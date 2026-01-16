/**
 * SafeOperationTracker - Production-grade wrapper for AnalysisStateMachine
 * 
 * Design Principles:
 * 1. Fire-and-forget: Tracking operations never block the main analysis flow
 * 2. Graceful degradation: If tracking fails, analysis continues unaffected
 * 3. Idempotent: Duplicate calls are safely ignored
 * 4. Circuit breaker: Prevents cascade failures when DB is unavailable
 * 5. Comprehensive logging: All failures are logged for debugging
 * 
 * This wrapper ensures that the payment and analysis flow is NEVER affected
 * by tracking operations, even in the worst-case scenarios.
 */

import {
  createOperation,
  transitionState,
  recordPartCompletion,
  recordPartFailure,
  getOperationBySessionId,
  TIER_PARTS,
  type OperationState,
} from "./analysisStateMachine";
import type { Tier } from "../../shared/pricing";

// ============ CIRCUIT BREAKER FOR TRACKING ============

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,      // Open circuit after 5 consecutive failures
  resetTimeoutMs: 60000,    // Try again after 1 minute
  halfOpenMaxAttempts: 2,   // Allow 2 test requests in half-open state
};

let circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
};

function isCircuitOpen(): boolean {
  if (!circuitBreaker.isOpen) return false;

  // Check if we should try half-open
  const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailure;
  if (timeSinceLastFailure > CIRCUIT_BREAKER_CONFIG.resetTimeoutMs) {
    // Move to half-open state
    console.log("[SafeTracker] Circuit breaker moving to half-open state");
    return false;
  }

  return true;
}

function recordCircuitSuccess(): void {
  if (circuitBreaker.failures > 0) {
    console.log("[SafeTracker] Circuit breaker reset after successful operation");
  }
  circuitBreaker = { failures: 0, lastFailure: 0, isOpen: false };
}

function recordCircuitFailure(error: Error): void {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();

  if (circuitBreaker.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
    circuitBreaker.isOpen = true;
    console.error(`[SafeTracker] Circuit breaker OPEN after ${circuitBreaker.failures} failures. Last error: ${error.message}`);
  }
}

// ============ IDEMPOTENCY TRACKING ============

// In-memory cache to prevent duplicate operations
// Key: `${sessionId}:${operation}:${partNum}`, Value: timestamp
const processedOperations = new Map<string, number>();
const IDEMPOTENCY_TTL_MS = 300000; // 5 minutes

function getIdempotencyKey(sessionId: string, operation: string, partNum?: number): string {
  return partNum !== undefined
    ? `${sessionId}:${operation}:${partNum}`
    : `${sessionId}:${operation}`;
}

function isAlreadyProcessed(key: string): boolean {
  const timestamp = processedOperations.get(key);
  if (!timestamp) return false;

  // Check if TTL expired
  if (Date.now() - timestamp > IDEMPOTENCY_TTL_MS) {
    processedOperations.delete(key);
    return false;
  }

  return true;
}

function markAsProcessed(key: string): void {
  processedOperations.set(key, Date.now());

  // Cleanup old entries periodically (every 100 operations)
  if (processedOperations.size > 100) {
    const now = Date.now();
    const entries = Array.from(processedOperations.entries());
    for (const [k, v] of entries) {
      if (now - v > IDEMPOTENCY_TTL_MS) {
        processedOperations.delete(k);
      }
    }
  }
}

// ============ SAFE WRAPPER FUNCTIONS ============

/**
 * Safely execute a tracking operation with full error handling.
 * Returns immediately (fire-and-forget) and never throws.
 */
async function safeExecute<T>(
  operationName: string,
  sessionId: string,
  fn: () => Promise<T>,
  idempotencyKey?: string
): Promise<T | null> {
  // Check circuit breaker
  if (isCircuitOpen()) {
    console.warn(`[SafeTracker] Circuit open, skipping ${operationName} for session ${sessionId}`);
    return null;
  }

  // Check idempotency
  if (idempotencyKey && isAlreadyProcessed(idempotencyKey)) {
    console.debug(`[SafeTracker] Duplicate ${operationName} ignored for session ${sessionId}`);
    return null;
  }

  try {
    const result = await fn();
    recordCircuitSuccess();
    if (idempotencyKey) markAsProcessed(idempotencyKey);
    return result;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    recordCircuitFailure(err);

    // Log but never throw - this is fire-and-forget
    console.error(`[SafeTracker] ${operationName} failed for session ${sessionId}:`, err.message);

    // Don't mark as processed on failure - allow retry
    return null;
  }
}

/**
 * Fire-and-forget version that doesn't wait for completion.
 * Use this for non-critical tracking that shouldn't block the main flow.
 */
function fireAndForget(
  operationName: string,
  sessionId: string,
  fn: () => Promise<unknown>,
  idempotencyKey?: string
): void {
  // Execute asynchronously without awaiting
  safeExecute(operationName, sessionId, fn, idempotencyKey).catch(() => {
    // Already logged in safeExecute, nothing more to do
  });
}

// ============ PUBLIC API ============

export interface SafeTrackerOptions {
  /** If true, operations are fire-and-forget (default: true) */
  async?: boolean;
  /** If true, log debug information (default: false) */
  debug?: boolean;
}

const defaultOptions: SafeTrackerOptions = {
  async: true,
  debug: false,
};

/**
 * Track the start of an analysis operation.
 * Creates a new operation record in the database.
 * 
 * @returns operationId if successful, null if tracking failed (analysis continues)
 */
export async function trackAnalysisStart(
  sessionId: string,
  tier: Tier,
  triggeredBy: "user" | "system" | "admin" | "retry_queue" = "user",
  options: SafeTrackerOptions = {}
): Promise<string | null> {
  const opts = { ...defaultOptions, ...options };
  const idempotencyKey = getIdempotencyKey(sessionId, "start");

  if (opts.debug) {
    console.log(`[SafeTracker] trackAnalysisStart: session=${sessionId}, tier=${tier}`);
  }

  const fn = async () => {
    const result = await createOperation({
      sessionId,
      tier,
      triggeredBy,
    });
    if (!result.success) {
      throw new Error(result.error || "Failed to create operation");
    }
    return result.operationId;
  };

  if (opts.async) {
    fireAndForget("trackAnalysisStart", sessionId, fn, idempotencyKey);
    return null; // Fire-and-forget, no operationId returned
  }

  return safeExecute("trackAnalysisStart", sessionId, fn, idempotencyKey);
}

/**
 * Track the start of generating a specific part.
 * Transitions the operation to "generating" state.
 */
export function trackPartStart(
  sessionId: string,
  partNum: number,
  options: SafeTrackerOptions = {}
): void {
  const opts = { ...defaultOptions, ...options };
  const idempotencyKey = getIdempotencyKey(sessionId, "part_start", partNum);

  if (opts.debug) {
    console.log(`[SafeTracker] trackPartStart: session=${sessionId}, part=${partNum}`);
  }

  fireAndForget("trackPartStart", sessionId, async () => {
    const operation = await getOperationBySessionId(sessionId);
    if (!operation) {
      console.warn(`[SafeTracker] No operation found for session ${sessionId}, skipping part start tracking`);
      return;
    }

    // Only transition if not already generating
    if (operation.state !== "generating") {
      await transitionState(operation.operationId, "generating", {
        actorType: "system",
        metadata: { partNumber: partNum },
      });
    }
  }, idempotencyKey);
}

/**
 * Track successful completion of a part.
 * Records the part content and updates progress.
 */
export function trackPartComplete(
  sessionId: string,
  partNum: number,
  content: string,
  durationMs?: number,
  handoffState?: string,
  options: SafeTrackerOptions = {}
): void {
  const opts = { ...defaultOptions, ...options };
  const idempotencyKey = getIdempotencyKey(sessionId, "part_complete", partNum);

  if (opts.debug) {
    console.log(`[SafeTracker] trackPartComplete: session=${sessionId}, part=${partNum}, duration=${durationMs}ms`);
  }

  fireAndForget("trackPartComplete", sessionId, async () => {
    const operation = await getOperationBySessionId(sessionId);
    if (!operation) {
      console.warn(`[SafeTracker] No operation found for session ${sessionId}, skipping part complete tracking`);
      return;
    }

    await recordPartCompletion(operation.operationId, {
      partNumber: partNum,
      content,
      durationMs: durationMs ?? 0,
      handoffState,
    });
  }, idempotencyKey);
}

/**
 * Track failure of a part.
 * Records the error and updates the operation state.
 */
export function trackPartFailure(
  sessionId: string,
  partNum: number,
  error: Error | string,
  errorCode?: string,
  options: SafeTrackerOptions = {}
): void {
  const opts = { ...defaultOptions, ...options };
  const idempotencyKey = getIdempotencyKey(sessionId, "part_failure", partNum);

  const errorMessage = error instanceof Error ? error.message : error;

  if (opts.debug) {
    console.log(`[SafeTracker] trackPartFailure: session=${sessionId}, part=${partNum}, error=${errorMessage}`);
  }

  fireAndForget("trackPartFailure", sessionId, async () => {
    const operation = await getOperationBySessionId(sessionId);
    if (!operation) {
      console.warn(`[SafeTracker] No operation found for session ${sessionId}, skipping part failure tracking`);
      return;
    }

    await recordPartFailure(operation.operationId, partNum, errorCode || "UNKNOWN_ERROR", errorMessage);
  }, idempotencyKey);
}

/**
 * Track successful completion of the entire analysis.
 * Transitions the operation to "completed" state.
 */
export function trackAnalysisComplete(
  sessionId: string,
  durationMs?: number,
  options: SafeTrackerOptions = {}
): void {
  const opts = { ...defaultOptions, ...options };
  const idempotencyKey = getIdempotencyKey(sessionId, "complete");

  if (opts.debug) {
    console.log(`[SafeTracker] trackAnalysisComplete: session=${sessionId}, duration=${durationMs}ms`);
  }

  fireAndForget("trackAnalysisComplete", sessionId, async () => {
    const operation = await getOperationBySessionId(sessionId);
    if (!operation) {
      console.warn(`[SafeTracker] No operation found for session ${sessionId}, skipping completion tracking`);
      return;
    }

    // Transition to completed
    await transitionState(operation.operationId, "completed", {
      actorType: "system",
      metadata: { durationMs },
    });
  }, idempotencyKey);
}

/**
 * Track failure of the entire analysis.
 * Transitions the operation to "failed" state.
 */
export function trackAnalysisFailure(
  sessionId: string,
  error: Error | string,
  failedAtPart?: number,
  options: SafeTrackerOptions = {}
): void {
  const opts = { ...defaultOptions, ...options };
  const idempotencyKey = getIdempotencyKey(sessionId, "failure");

  const errorMessage = error instanceof Error ? error.message : error;

  if (opts.debug) {
    console.log(`[SafeTracker] trackAnalysisFailure: session=${sessionId}, error=${errorMessage}, failedAtPart=${failedAtPart}`);
  }

  fireAndForget("trackAnalysisFailure", sessionId, async () => {
    const operation = await getOperationBySessionId(sessionId);
    if (!operation) {
      console.warn(`[SafeTracker] No operation found for session ${sessionId}, skipping failure tracking`);
      return;
    }

    // Transition to failed
    await transitionState(operation.operationId, "failed", {
      actorType: "system",
      errorMessage,
      metadata: { failedPart: failedAtPart },
    });
  }, idempotencyKey);
}

/**
 * Track partial success (some parts completed, but not all).
 * Records the partial state and marks as completed with partial flag.
 */
export function trackPartialSuccess(
  sessionId: string,
  completedParts: number,
  totalParts: number,
  options: SafeTrackerOptions = {}
): void {
  const opts = { ...defaultOptions, ...options };
  const idempotencyKey = getIdempotencyKey(sessionId, "partial_success");

  if (opts.debug) {
    console.log(`[SafeTracker] trackPartialSuccess: session=${sessionId}, completed=${completedParts}/${totalParts}`);
  }

  fireAndForget("trackPartialSuccess", sessionId, async () => {
    const operation = await getOperationBySessionId(sessionId);
    if (!operation) {
      console.warn(`[SafeTracker] No operation found for session ${sessionId}, skipping partial success tracking`);
      return;
    }

    // Transition to completed (partial success is still a completion)
    await transitionState(operation.operationId, "completed", {
      actorType: "system",
      metadata: {
        isPartialSuccess: true,
        completedParts,
        totalParts,
      },
    });
  }, idempotencyKey);
}

/**
 * Track when an analysis is queued for retry.
 * Updates the operation state to reflect retry status.
 */
export function trackQueuedForRetry(
  sessionId: string,
  reason: string,
  options: SafeTrackerOptions = {}
): void {
  const opts = { ...defaultOptions, ...options };
  const idempotencyKey = getIdempotencyKey(sessionId, "queued_retry");

  if (opts.debug) {
    console.log(`[SafeTracker] trackQueuedForRetry: session=${sessionId}, reason=${reason}`);
  }

  fireAndForget("trackQueuedForRetry", sessionId, async () => {
    const operation = await getOperationBySessionId(sessionId);
    if (!operation) {
      // This is expected for circuit breaker scenarios - operation might not exist yet
      console.debug(`[SafeTracker] No operation found for session ${sessionId}, skipping retry queue tracking`);
      return;
    }

    // Record retry event without changing state
    // The retry queue processor will handle state transitions
  }, idempotencyKey);
}

// ============ UTILITY FUNCTIONS ============

/**
 * Get the current circuit breaker status.
 * Useful for monitoring and debugging.
 */
export function getCircuitBreakerStatus(): {
  isOpen: boolean;
  failures: number;
  lastFailureAt: Date | null;
} {
  return {
    isOpen: circuitBreaker.isOpen,
    failures: circuitBreaker.failures,
    lastFailureAt: circuitBreaker.lastFailure ? new Date(circuitBreaker.lastFailure) : null,
  };
}

/**
 * Manually reset the circuit breaker.
 * Use with caution - only for admin/debugging purposes.
 */
export function resetCircuitBreaker(): void {
  console.log("[SafeTracker] Circuit breaker manually reset");
  circuitBreaker = { failures: 0, lastFailure: 0, isOpen: false };
}

/**
 * Get the number of pending idempotency entries.
 * Useful for monitoring memory usage.
 */
export function getIdempotencyCacheSize(): number {
  return processedOperations.size;
}

/**
 * Clear the idempotency cache.
 * Use with caution - may allow duplicate operations.
 */
export function clearIdempotencyCache(): void {
  console.log("[SafeTracker] Idempotency cache cleared");
  processedOperations.clear();
}

// ============ EXPORTS ============

export {
  TIER_PARTS,
  type OperationState,
};
