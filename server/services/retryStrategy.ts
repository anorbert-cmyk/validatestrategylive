/**
 * Retry Strategy Module
 * 
 * Implements sophisticated retry mechanisms including:
 * - Exponential backoff with jitter
 * - Circuit breaker pattern
 * - Tier-specific retry configurations
 * - Retry queue with priority
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                         RETRY FLOW                                      │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │   Request → Circuit Breaker Check → Execute → Success? → Return        │
 * │                    │                    │         │                     │
 * │                    ↓                    ↓         No                    │
 * │               Is Open? ──Yes──→ Fail Fast        │                     │
 * │                    │                              ↓                     │
 * │                   No                    Classify Error                  │
 * │                    │                              │                     │
 * │                    ↓                              ↓                     │
 * │               Execute                    Is Retryable?                  │
 * │                                               │    │                    │
 * │                                              Yes   No                   │
 * │                                               │    │                    │
 * │                                               ↓    ↓                    │
 * │                                     Calculate Backoff  Throw Error     │
 * │                                               │                         │
 * │                                               ↓                         │
 * │                                          Wait + Retry                   │
 * │                                               │                         │
 * │                                               ↓                         │
 * │                                     Max Retries? ──Yes──→ Fail         │
 * │                                               │                         │
 * │                                              No                         │
 * │                                               │                         │
 * │                                               └────→ Loop Back          │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { Tier } from "../../shared/pricing";
import {
  AnalysisError,
  ApiError,
  TimeoutError,
  CircuitBreakerOpenError,
  MaxRetriesExceededError,
  AnalysisErrorCode,
  ErrorCategory,
  TIER_ERROR_CONFIGS,
  classifyError,
  ErrorContext,
} from "./errorHandling";

// ============================================================================
// EXPONENTIAL BACKOFF
// ============================================================================

export interface BackoffConfig {
  baseDelay: number;
  maxDelay: number;
  factor: number;
  jitter: boolean;
}

const DEFAULT_BACKOFF_CONFIG: BackoffConfig = {
  baseDelay: 1000,
  maxDelay: 30000,
  factor: 2,
  jitter: true,
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
export function calculateBackoff(
  attempt: number,
  config: Partial<BackoffConfig> = {}
): number {
  const { baseDelay, maxDelay, factor, jitter } = {
    ...DEFAULT_BACKOFF_CONFIG,
    ...config,
  };

  // Exponential delay: baseDelay * factor^attempt
  let delay = baseDelay * Math.pow(factor, attempt);

  // Cap at maxDelay
  delay = Math.min(delay, maxDelay);

  // Add jitter (±25%) to prevent thundering herd
  if (jitter) {
    const jitterRange = delay * 0.25;
    delay = delay - jitterRange + Math.random() * jitterRange * 2;
  }

  return Math.floor(delay);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

export enum CircuitState {
  CLOSED = "closed",     // Normal operation
  OPEN = "open",         // Failing, reject requests
  HALF_OPEN = "half_open", // Testing if service recovered
}

export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time in ms before attempting to close circuit */
  resetTimeout: number;
  /** Number of successful requests needed to close circuit */
  successThreshold: number;
  /** Time window for counting failures (ms) */
  failureWindow: number;
}

const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  successThreshold: 2,
  failureWindow: 120000, // 2 minutes
};

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  failureTimestamps: number[];
}

/**
 * Circuit Breaker implementation for API protection
 */
export class CircuitBreaker {
  private state: CircuitBreakerState;
  private config: CircuitBreakerConfig;
  private name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = { ...DEFAULT_CIRCUIT_CONFIG, ...config };
    this.state = {
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      failureTimestamps: [],
    };
  }

  /**
   * Check if request can proceed
   */
  canExecute(): boolean {
    this.cleanOldFailures();

    switch (this.state.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        if (Date.now() >= this.state.nextAttemptTime) {
          // Transition to half-open
          this.state.state = CircuitState.HALF_OPEN;
          this.state.successes = 0;
          console.log(`[CircuitBreaker:${this.name}] Transitioning to HALF_OPEN`);
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        return true;

      default:
        return true;
    }
  }

  /**
   * Record a successful execution
   */
  recordSuccess(): void {
    switch (this.state.state) {
      case CircuitState.HALF_OPEN:
        this.state.successes++;
        if (this.state.successes >= this.config.successThreshold) {
          this.state.state = CircuitState.CLOSED;
          this.state.failures = 0;
          this.state.failureTimestamps = [];
          console.log(`[CircuitBreaker:${this.name}] Circuit CLOSED after ${this.state.successes} successes`);
        }
        break;

      case CircuitState.CLOSED:
        // Reset failure count on success
        this.state.failures = Math.max(0, this.state.failures - 1);
        break;
    }
  }

  /**
   * Record a failed execution
   */
  recordFailure(): void {
    const now = Date.now();
    this.state.failureTimestamps.push(now);
    this.state.lastFailureTime = now;
    this.state.failures++;

    switch (this.state.state) {
      case CircuitState.HALF_OPEN:
        // Any failure in half-open reopens the circuit
        this.openCircuit();
        console.log(`[CircuitBreaker:${this.name}] Circuit OPENED from HALF_OPEN`);
        break;

      case CircuitState.CLOSED:
        this.cleanOldFailures();
        if (this.state.failureTimestamps.length >= this.config.failureThreshold) {
          this.openCircuit();
          console.log(`[CircuitBreaker:${this.name}] Circuit OPENED after ${this.state.failures} failures`);
        }
        break;
    }
  }

  /**
   * Open the circuit
   */
  private openCircuit(): void {
    this.state.state = CircuitState.OPEN;
    this.state.nextAttemptTime = Date.now() + this.config.resetTimeout;
  }

  /**
   * Remove failures outside the failure window
   */
  private cleanOldFailures(): void {
    const cutoff = Date.now() - this.config.failureWindow;
    this.state.failureTimestamps = this.state.failureTimestamps.filter(
      (ts) => ts > cutoff
    );
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state.state;
  }

  /**
   * Get time until circuit might close (for OPEN state)
   */
  getResetTime(): Date | null {
    if (this.state.state === CircuitState.OPEN) {
      return new Date(this.state.nextAttemptTime);
    }
    return null;
  }

  /**
   * Get circuit statistics
   */
  getStats(): {
    state: CircuitState;
    failures: number;
    recentFailures: number;
    resetTime: Date | null;
  } {
    this.cleanOldFailures();
    return {
      state: this.state.state,
      failures: this.state.failures,
      recentFailures: this.state.failureTimestamps.length,
      resetTime: this.getResetTime(),
    };
  }

  /**
   * Force reset the circuit (admin action)
   */
  forceReset(): void {
    this.state = {
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
      failureTimestamps: [],
    };
    console.log(`[CircuitBreaker:${this.name}] Force reset to CLOSED`);
  }
}

// Global circuit breaker instance for Perplexity API
export const perplexityCircuitBreaker = new CircuitBreaker("perplexity", {
  failureThreshold: 5,
  resetTimeout: 60000,
  successThreshold: 2,
  failureWindow: 120000,
});

// ============================================================================
// RETRY EXECUTOR
// ============================================================================

export interface RetryOptions<T> {
  /** Operation to retry */
  operation: () => Promise<T>;
  /** Context for error reporting */
  context: Partial<ErrorContext>;
  /** Tier for configuration */
  tier: Tier;
  /** Optional circuit breaker */
  circuitBreaker?: CircuitBreaker;
  /** Callback on each retry attempt */
  onRetry?: (attempt: number, error: AnalysisError, delay: number) => void;
  /** Callback on final failure */
  onFinalFailure?: (error: AnalysisError) => void;
  /** Custom retry condition */
  shouldRetry?: (error: AnalysisError) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: AnalysisError;
  attempts: number;
  totalTime: number;
}

/**
 * Execute operation with retry logic
 */
export async function executeWithRetry<T>(
  options: RetryOptions<T>
): Promise<RetryResult<T>> {
  const {
    operation,
    context,
    tier,
    circuitBreaker,
    onRetry,
    onFinalFailure,
    shouldRetry,
  } = options;

  const config = TIER_ERROR_CONFIGS[tier];
  const startTime = Date.now();
  let lastError: AnalysisError | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    // Check circuit breaker
    if (circuitBreaker && !circuitBreaker.canExecute()) {
      const resetTime = circuitBreaker.getResetTime();
      const error = new CircuitBreakerOpenError(resetTime || new Date(), context);
      return {
        success: false,
        error,
        attempts: attempt,
        totalTime: Date.now() - startTime,
      };
    }

    try {
      // Execute the operation
      const result = await operation();

      // Record success
      if (circuitBreaker) {
        circuitBreaker.recordSuccess();
      }

      return {
        success: true,
        data: result,
        attempts: attempt + 1,
        totalTime: Date.now() - startTime,
      };
    } catch (err) {
      // Classify the error
      lastError = classifyError(err, {
        ...context,
        attemptNumber: attempt + 1,
      });

      // Record failure
      if (circuitBreaker) {
        circuitBreaker.recordFailure();
      }

      // Check if we should retry
      const canRetry =
        attempt < config.maxRetries &&
        lastError.isRetryable &&
        (shouldRetry ? shouldRetry(lastError) : true);

      if (!canRetry) {
        break;
      }

      // Calculate backoff delay
      const delay = calculateBackoff(attempt, {
        baseDelay: config.baseDelay,
        maxDelay: config.maxDelay,
      });

      // Notify retry callback
      if (onRetry) {
        onRetry(attempt + 1, lastError, delay);
      }

      console.log(
        `[Retry] Attempt ${attempt + 1}/${config.maxRetries} failed for ${tier} tier. ` +
        `Retrying in ${delay}ms. Error: ${lastError.code}`
      );

      // Wait before retry
      await sleep(delay);
    }
  }

  // All retries exhausted
  const finalError = new MaxRetriesExceededError(
    config.maxRetries + 1,
    tier,
    context,
    lastError
  );

  if (onFinalFailure) {
    onFinalFailure(finalError);
  }

  return {
    success: false,
    error: finalError,
    attempts: config.maxRetries + 1,
    totalTime: Date.now() - startTime,
  };
}

// ============================================================================
// RETRY QUEUE
// ============================================================================

interface QueuedRetry {
  id: string;
  sessionId: string;
  tier: Tier;
  operation: string;
  priority: number;
  createdAt: Date;
  scheduledFor: Date;
  attempts: number;
  lastError?: string;
}

class RetryQueue {
  private queue: QueuedRetry[] = [];
  private processing: boolean = false;
  private maxQueueSize: number = 100;

  /**
   * Add a retry to the queue
   */
  enqueue(item: Omit<QueuedRetry, "id" | "createdAt">): string {
    if (this.queue.length >= this.maxQueueSize) {
      // Remove lowest priority item
      this.queue.sort((a, b) => b.priority - a.priority);
      this.queue.pop();
    }

    const id = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queueItem: QueuedRetry = {
      ...item,
      id,
      createdAt: new Date(),
    };

    this.queue.push(queueItem);
    this.queue.sort((a, b) => {
      // Sort by scheduled time, then by priority
      const timeDiff = a.scheduledFor.getTime() - b.scheduledFor.getTime();
      if (timeDiff !== 0) return timeDiff;
      return b.priority - a.priority;
    });

    console.log(`[RetryQueue] Enqueued retry ${id} for session ${item.sessionId}`);
    return id;
  }

  /**
   * Get next retry ready for processing
   */
  dequeue(): QueuedRetry | null {
    const now = new Date();
    const index = this.queue.findIndex((item) => item.scheduledFor <= now);
    if (index === -1) return null;
    return this.queue.splice(index, 1)[0];
  }

  /**
   * Remove a retry from the queue
   */
  remove(id: string): boolean {
    const index = this.queue.findIndex((item) => item.id === id);
    if (index === -1) return false;
    this.queue.splice(index, 1);
    return true;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    size: number;
    byTier: Record<Tier, number>;
    oldestItem: Date | null;
  } {
    const byTier: Record<Tier, number> = {
      standard: 0,
      medium: 0,
      full: 0,
    };

    for (const item of this.queue) {
      byTier[item.tier]++;
    }

    return {
      size: this.queue.length,
      byTier,
      oldestItem: this.queue.length > 0 ? this.queue[0].createdAt : null,
    };
  }

  /**
   * Get all queued items for a session
   */
  getBySession(sessionId: string): QueuedRetry[] {
    return this.queue.filter((item) => item.sessionId === sessionId);
  }
}

export const retryQueue = new RetryQueue();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Wrap an async function with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(operation, timeoutMs));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Execute multiple operations with individual retries
 */
export async function executePartsWithRetry<T>(
  parts: Array<{
    partNumber: number;
    operation: () => Promise<T>;
  }>,
  options: Omit<RetryOptions<T>, "operation">
): Promise<{
  results: Map<number, T>;
  errors: Map<number, AnalysisError>;
  allSucceeded: boolean;
}> {
  const results = new Map<number, T>();
  const errors = new Map<number, AnalysisError>();

  await Promise.all(
    parts.map(async ({ partNumber, operation }) => {
      const result = await executeWithRetry({
        ...options,
        operation,
        context: {
          ...options.context,
          partNumber,
        },
      });

      if (result.success && result.data !== undefined) {
        results.set(partNumber, result.data);
      } else if (result.error) {
        errors.set(partNumber, result.error);
      }
    })
  );

  return {
    results,
    errors,
    allSucceeded: errors.size === 0,
  };
}
