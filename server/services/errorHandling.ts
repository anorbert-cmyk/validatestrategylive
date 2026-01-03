/**
 * Error Handling Architecture for ValidateStrategy
 * 
 * This module provides a comprehensive error handling system designed with
 * System Architect principles for reliability, observability, and recovery.
 * 
 * Architecture Overview:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                        ERROR HANDLING FLOW                              │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  API Call → Retry Logic → Circuit Breaker → Error Classification       │
 * │      ↓           ↓              ↓                   ↓                   │
 * │  Success    Backoff        Trip/Reset         Categorize               │
 * │      ↓           ↓              ↓                   ↓                   │
 * │  Result     Retry         Fail Fast          Handle by Type            │
 * │                                                     ↓                   │
 * │                              ┌──────────────────────┴──────────────────┐│
 * │                              │ Recoverable │ Partial │ Fatal           ││
 * │                              │     ↓       │    ↓    │   ↓             ││
 * │                              │   Retry     │  Save   │ Notify          ││
 * │                              │   Queue     │ Progress│ + Refund        ││
 * │                              └─────────────┴─────────┴─────────────────┘│
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { Tier } from "../../shared/pricing";

// ============================================================================
// ERROR CODES - Unique identifiers for each error type
// ============================================================================

export enum AnalysisErrorCode {
  // API Errors (1xxx)
  API_TIMEOUT = "ERR_1001",
  API_RATE_LIMIT = "ERR_1002",
  API_AUTHENTICATION = "ERR_1003",
  API_INVALID_RESPONSE = "ERR_1004",
  API_SERVICE_UNAVAILABLE = "ERR_1005",
  API_QUOTA_EXCEEDED = "ERR_1006",
  
  // Network Errors (2xxx)
  NETWORK_TIMEOUT = "ERR_2001",
  NETWORK_CONNECTION_REFUSED = "ERR_2002",
  NETWORK_DNS_FAILURE = "ERR_2003",
  
  // Validation Errors (3xxx)
  VALIDATION_PROBLEM_STATEMENT = "ERR_3001",
  VALIDATION_TIER_INVALID = "ERR_3002",
  VALIDATION_SESSION_NOT_FOUND = "ERR_3003",
  VALIDATION_PAYMENT_NOT_CONFIRMED = "ERR_3004",
  
  // Processing Errors (4xxx)
  PROCESSING_PART_FAILED = "ERR_4001",
  PROCESSING_TIMEOUT = "ERR_4002",
  PROCESSING_CONTENT_EMPTY = "ERR_4003",
  PROCESSING_PARSE_ERROR = "ERR_4004",
  
  // System Errors (5xxx)
  SYSTEM_DATABASE_ERROR = "ERR_5001",
  SYSTEM_MEMORY_EXCEEDED = "ERR_5002",
  SYSTEM_INTERNAL_ERROR = "ERR_5003",
  
  // Recovery Errors (6xxx)
  RECOVERY_MAX_RETRIES = "ERR_6001",
  RECOVERY_CIRCUIT_OPEN = "ERR_6002",
  RECOVERY_PARTIAL_FAILURE = "ERR_6003",
}

// ============================================================================
// ERROR SEVERITY LEVELS
// ============================================================================

export enum ErrorSeverity {
  /** Informational - No action needed, logged for debugging */
  INFO = "info",
  /** Warning - Potential issue, monitoring recommended */
  WARNING = "warning",
  /** Error - Operation failed, retry may help */
  ERROR = "error",
  /** Critical - System-level failure, immediate attention needed */
  CRITICAL = "critical",
  /** Fatal - Unrecoverable, requires manual intervention */
  FATAL = "fatal",
}

// ============================================================================
// ERROR CATEGORIES - Determines handling strategy
// ============================================================================

export enum ErrorCategory {
  /** Can be retried automatically */
  RECOVERABLE = "recoverable",
  /** Partial results available, can continue with degraded output */
  PARTIAL = "partial",
  /** Cannot be recovered, requires user action or refund */
  FATAL = "fatal",
  /** Rate limited, needs backoff */
  RATE_LIMITED = "rate_limited",
  /** Timeout, may succeed on retry */
  TIMEOUT = "timeout",
}

// ============================================================================
// TIER-SPECIFIC CONFIGURATION
// ============================================================================

export interface TierErrorConfig {
  /** Maximum retry attempts */
  maxRetries: number;
  /** Base delay for exponential backoff (ms) */
  baseDelay: number;
  /** Maximum delay cap (ms) */
  maxDelay: number;
  /** Timeout per part (ms) */
  partTimeout: number;
  /** Total analysis timeout (ms) */
  totalTimeout: number;
  /** Number of parts expected */
  expectedParts: number;
  /** Minimum parts for partial success */
  minPartsForPartialSuccess: number;
  /** Priority level for retry queue */
  retryPriority: number;
}

export const TIER_ERROR_CONFIGS: Record<Tier, TierErrorConfig> = {
  standard: {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 10000,
    partTimeout: 60000, // 1 minute
    totalTimeout: 120000, // 2 minutes
    expectedParts: 1,
    minPartsForPartialSuccess: 1,
    retryPriority: 1,
  },
  medium: {
    maxRetries: 3,
    baseDelay: 1500,
    maxDelay: 15000,
    partTimeout: 90000, // 1.5 minutes per part
    totalTimeout: 300000, // 5 minutes total
    expectedParts: 2,
    minPartsForPartialSuccess: 1,
    retryPriority: 2,
  },
  full: {
    maxRetries: 5,
    baseDelay: 2000,
    maxDelay: 30000,
    partTimeout: 120000, // 2 minutes per part
    totalTimeout: 900000, // 15 minutes total
    expectedParts: 6,
    minPartsForPartialSuccess: 4,
    retryPriority: 3,
  },
};

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

export interface ErrorContext {
  sessionId?: string;
  tier?: Tier;
  partNumber?: number;
  attemptNumber?: number;
  timestamp: Date;
  requestId?: string;
  userId?: string;
  problemStatementPreview?: string;
  additionalData?: Record<string, unknown>;
}

export interface ErrorMetadata {
  code: AnalysisErrorCode;
  severity: ErrorSeverity;
  category: ErrorCategory;
  isRetryable: boolean;
  suggestedAction: string;
  userMessage: string;
  technicalMessage: string;
}

/**
 * Base error class for all analysis-related errors
 */
export class AnalysisError extends Error {
  public readonly code: AnalysisErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly category: ErrorCategory;
  public readonly context: ErrorContext;
  public readonly isRetryable: boolean;
  public readonly suggestedAction: string;
  public readonly userMessage: string;
  public readonly originalError?: Error;
  public readonly timestamp: Date;

  constructor(
    metadata: ErrorMetadata,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(metadata.technicalMessage);
    this.name = "AnalysisError";
    this.code = metadata.code;
    this.severity = metadata.severity;
    this.category = metadata.category;
    this.isRetryable = metadata.isRetryable;
    this.suggestedAction = metadata.suggestedAction;
    this.userMessage = metadata.userMessage;
    this.originalError = originalError;
    this.timestamp = new Date();
    this.context = {
      ...context,
      timestamp: this.timestamp,
    };

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AnalysisError);
    }
  }

  /**
   * Convert to JSON for logging/storage
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      severity: this.severity,
      category: this.category,
      message: this.message,
      userMessage: this.userMessage,
      suggestedAction: this.suggestedAction,
      isRetryable: this.isRetryable,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      originalError: this.originalError?.message,
    };
  }

  /**
   * Get a user-friendly error response
   */
  toUserResponse(): {
    error: true;
    code: string;
    message: string;
    action: string;
    canRetry: boolean;
  } {
    return {
      error: true,
      code: this.code,
      message: this.userMessage,
      action: this.suggestedAction,
      canRetry: this.isRetryable,
    };
  }
}

// ============================================================================
// SPECIALIZED ERROR CLASSES
// ============================================================================

/**
 * API-related errors (Perplexity, external services)
 */
export class ApiError extends AnalysisError {
  public readonly statusCode?: number;
  public readonly endpoint?: string;

  constructor(
    code: AnalysisErrorCode,
    message: string,
    context: Partial<ErrorContext> = {},
    statusCode?: number,
    endpoint?: string,
    originalError?: Error
  ) {
    const metadata = getErrorMetadata(code, message);
    super(metadata, context, originalError);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

/**
 * Timeout errors
 */
export class TimeoutError extends AnalysisError {
  public readonly timeoutMs: number;
  public readonly operation: string;

  constructor(
    operation: string,
    timeoutMs: number,
    context: Partial<ErrorContext> = {}
  ) {
    const metadata: ErrorMetadata = {
      code: AnalysisErrorCode.PROCESSING_TIMEOUT,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.TIMEOUT,
      isRetryable: true,
      suggestedAction: "The operation will be retried automatically",
      userMessage: `The analysis is taking longer than expected. We're retrying...`,
      technicalMessage: `Operation "${operation}" timed out after ${timeoutMs}ms`,
    };
    super(metadata, context);
    this.name = "TimeoutError";
    this.timeoutMs = timeoutMs;
    this.operation = operation;
  }
}

/**
 * Partial failure errors (some parts succeeded)
 */
export class PartialFailureError extends AnalysisError {
  public readonly completedParts: number[];
  public readonly failedParts: number[];
  public readonly partialContent: Record<string, string>;

  constructor(
    completedParts: number[],
    failedParts: number[],
    partialContent: Record<string, string>,
    context: Partial<ErrorContext> = {}
  ) {
    const metadata: ErrorMetadata = {
      code: AnalysisErrorCode.RECOVERY_PARTIAL_FAILURE,
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.PARTIAL,
      isRetryable: true,
      suggestedAction: "Partial results have been saved. Missing parts will be retried.",
      userMessage: `Your analysis is ${Math.round((completedParts.length / (completedParts.length + failedParts.length)) * 100)}% complete. We're working on the remaining sections.`,
      technicalMessage: `Partial failure: ${completedParts.length} parts completed, ${failedParts.length} parts failed`,
    };
    super(metadata, context);
    this.name = "PartialFailureError";
    this.completedParts = completedParts;
    this.failedParts = failedParts;
    this.partialContent = partialContent;
  }
}

/**
 * Circuit breaker open error
 */
export class CircuitBreakerOpenError extends AnalysisError {
  public readonly resetTime: Date;

  constructor(resetTime: Date, context: Partial<ErrorContext> = {}) {
    const metadata: ErrorMetadata = {
      code: AnalysisErrorCode.RECOVERY_CIRCUIT_OPEN,
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.RATE_LIMITED,
      isRetryable: false,
      suggestedAction: `Service will be available again at ${resetTime.toLocaleTimeString()}`,
      userMessage: "Our analysis service is temporarily unavailable. Please try again in a few minutes.",
      technicalMessage: `Circuit breaker is open until ${resetTime.toISOString()}`,
    };
    super(metadata, context);
    this.name = "CircuitBreakerOpenError";
    this.resetTime = resetTime;
  }
}

/**
 * Max retries exceeded error
 */
export class MaxRetriesExceededError extends AnalysisError {
  public readonly attemptsMade: number;
  public readonly lastError?: Error;

  constructor(
    attemptsMade: number,
    tier: Tier,
    context: Partial<ErrorContext> = {},
    lastError?: Error
  ) {
    const config = TIER_ERROR_CONFIGS[tier];
    const metadata: ErrorMetadata = {
      code: AnalysisErrorCode.RECOVERY_MAX_RETRIES,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.FATAL,
      isRetryable: false,
      suggestedAction: "Please contact support for assistance or request a refund.",
      userMessage: "We were unable to complete your analysis after multiple attempts. Our team has been notified.",
      technicalMessage: `Max retries (${config.maxRetries}) exceeded after ${attemptsMade} attempts`,
    };
    super(metadata, { ...context, tier }, lastError);
    this.name = "MaxRetriesExceededError";
    this.attemptsMade = attemptsMade;
    this.lastError = lastError;
  }
}

// ============================================================================
// ERROR METADATA FACTORY
// ============================================================================

function getErrorMetadata(code: AnalysisErrorCode, technicalMessage: string): ErrorMetadata {
  const errorDefinitions: Record<AnalysisErrorCode, Omit<ErrorMetadata, "technicalMessage">> = {
    // API Errors
    [AnalysisErrorCode.API_TIMEOUT]: {
      code: AnalysisErrorCode.API_TIMEOUT,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.TIMEOUT,
      isRetryable: true,
      suggestedAction: "The request will be retried automatically",
      userMessage: "The analysis service is responding slowly. Retrying...",
    },
    [AnalysisErrorCode.API_RATE_LIMIT]: {
      code: AnalysisErrorCode.API_RATE_LIMIT,
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.RATE_LIMITED,
      isRetryable: true,
      suggestedAction: "Request queued for retry after cooldown",
      userMessage: "High demand detected. Your analysis has been queued.",
    },
    [AnalysisErrorCode.API_AUTHENTICATION]: {
      code: AnalysisErrorCode.API_AUTHENTICATION,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.FATAL,
      isRetryable: false,
      suggestedAction: "Contact support immediately",
      userMessage: "A configuration error occurred. Our team has been notified.",
    },
    [AnalysisErrorCode.API_INVALID_RESPONSE]: {
      code: AnalysisErrorCode.API_INVALID_RESPONSE,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.RECOVERABLE,
      isRetryable: true,
      suggestedAction: "Retrying with different parameters",
      userMessage: "Received unexpected data. Retrying...",
    },
    [AnalysisErrorCode.API_SERVICE_UNAVAILABLE]: {
      code: AnalysisErrorCode.API_SERVICE_UNAVAILABLE,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.RECOVERABLE,
      isRetryable: true,
      suggestedAction: "Service will be retried after backoff",
      userMessage: "Analysis service temporarily unavailable. Retrying...",
    },
    [AnalysisErrorCode.API_QUOTA_EXCEEDED]: {
      code: AnalysisErrorCode.API_QUOTA_EXCEEDED,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.FATAL,
      isRetryable: false,
      suggestedAction: "Contact support for quota increase",
      userMessage: "Service capacity reached. Please try again later.",
    },
    
    // Network Errors
    [AnalysisErrorCode.NETWORK_TIMEOUT]: {
      code: AnalysisErrorCode.NETWORK_TIMEOUT,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.TIMEOUT,
      isRetryable: true,
      suggestedAction: "Retrying connection",
      userMessage: "Connection timed out. Retrying...",
    },
    [AnalysisErrorCode.NETWORK_CONNECTION_REFUSED]: {
      code: AnalysisErrorCode.NETWORK_CONNECTION_REFUSED,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.RECOVERABLE,
      isRetryable: true,
      suggestedAction: "Retrying after delay",
      userMessage: "Unable to connect. Retrying...",
    },
    [AnalysisErrorCode.NETWORK_DNS_FAILURE]: {
      code: AnalysisErrorCode.NETWORK_DNS_FAILURE,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.FATAL,
      isRetryable: false,
      suggestedAction: "Check network configuration",
      userMessage: "Network error occurred. Please try again later.",
    },
    
    // Validation Errors
    [AnalysisErrorCode.VALIDATION_PROBLEM_STATEMENT]: {
      code: AnalysisErrorCode.VALIDATION_PROBLEM_STATEMENT,
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.FATAL,
      isRetryable: false,
      suggestedAction: "Please provide a valid problem statement",
      userMessage: "Your problem statement needs more detail. Please expand on your idea.",
    },
    [AnalysisErrorCode.VALIDATION_TIER_INVALID]: {
      code: AnalysisErrorCode.VALIDATION_TIER_INVALID,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.FATAL,
      isRetryable: false,
      suggestedAction: "Select a valid tier",
      userMessage: "Invalid tier selected. Please choose Observer, Insider, or Syndicate.",
    },
    [AnalysisErrorCode.VALIDATION_SESSION_NOT_FOUND]: {
      code: AnalysisErrorCode.VALIDATION_SESSION_NOT_FOUND,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.FATAL,
      isRetryable: false,
      suggestedAction: "Start a new analysis session",
      userMessage: "Session not found. Please start a new analysis.",
    },
    [AnalysisErrorCode.VALIDATION_PAYMENT_NOT_CONFIRMED]: {
      code: AnalysisErrorCode.VALIDATION_PAYMENT_NOT_CONFIRMED,
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.FATAL,
      isRetryable: false,
      suggestedAction: "Complete payment to proceed",
      userMessage: "Payment not confirmed. Please complete your purchase.",
    },
    
    // Processing Errors
    [AnalysisErrorCode.PROCESSING_PART_FAILED]: {
      code: AnalysisErrorCode.PROCESSING_PART_FAILED,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.PARTIAL,
      isRetryable: true,
      suggestedAction: "Retrying failed part",
      userMessage: "A section of your analysis encountered an issue. Retrying...",
    },
    [AnalysisErrorCode.PROCESSING_TIMEOUT]: {
      code: AnalysisErrorCode.PROCESSING_TIMEOUT,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.TIMEOUT,
      isRetryable: true,
      suggestedAction: "Retrying with extended timeout",
      userMessage: "Analysis taking longer than expected. Extending time...",
    },
    [AnalysisErrorCode.PROCESSING_CONTENT_EMPTY]: {
      code: AnalysisErrorCode.PROCESSING_CONTENT_EMPTY,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.RECOVERABLE,
      isRetryable: true,
      suggestedAction: "Regenerating content",
      userMessage: "Content generation incomplete. Regenerating...",
    },
    [AnalysisErrorCode.PROCESSING_PARSE_ERROR]: {
      code: AnalysisErrorCode.PROCESSING_PARSE_ERROR,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.RECOVERABLE,
      isRetryable: true,
      suggestedAction: "Retrying with alternative parsing",
      userMessage: "Processing error. Retrying...",
    },
    
    // System Errors
    [AnalysisErrorCode.SYSTEM_DATABASE_ERROR]: {
      code: AnalysisErrorCode.SYSTEM_DATABASE_ERROR,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.RECOVERABLE,
      isRetryable: true,
      suggestedAction: "Retrying database operation",
      userMessage: "Temporary storage issue. Retrying...",
    },
    [AnalysisErrorCode.SYSTEM_MEMORY_EXCEEDED]: {
      code: AnalysisErrorCode.SYSTEM_MEMORY_EXCEEDED,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.FATAL,
      isRetryable: false,
      suggestedAction: "Contact support",
      userMessage: "System resource limit reached. Our team has been notified.",
    },
    [AnalysisErrorCode.SYSTEM_INTERNAL_ERROR]: {
      code: AnalysisErrorCode.SYSTEM_INTERNAL_ERROR,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.FATAL,
      isRetryable: false,
      suggestedAction: "Contact support",
      userMessage: "An unexpected error occurred. Our team has been notified.",
    },
    
    // Recovery Errors
    [AnalysisErrorCode.RECOVERY_MAX_RETRIES]: {
      code: AnalysisErrorCode.RECOVERY_MAX_RETRIES,
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.FATAL,
      isRetryable: false,
      suggestedAction: "Contact support for manual retry or refund",
      userMessage: "Unable to complete analysis after multiple attempts. Please contact support.",
    },
    [AnalysisErrorCode.RECOVERY_CIRCUIT_OPEN]: {
      code: AnalysisErrorCode.RECOVERY_CIRCUIT_OPEN,
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.RATE_LIMITED,
      isRetryable: false,
      suggestedAction: "Wait for circuit to reset",
      userMessage: "Service temporarily paused. Please try again in a few minutes.",
    },
    [AnalysisErrorCode.RECOVERY_PARTIAL_FAILURE]: {
      code: AnalysisErrorCode.RECOVERY_PARTIAL_FAILURE,
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.PARTIAL,
      isRetryable: true,
      suggestedAction: "Completing remaining parts",
      userMessage: "Your analysis is partially complete. Finishing remaining sections...",
    },
  };

  return {
    ...errorDefinitions[code],
    technicalMessage,
  };
}

// ============================================================================
// ERROR CLASSIFICATION UTILITY
// ============================================================================

/**
 * Classify an unknown error into our error taxonomy
 */
export function classifyError(
  error: unknown,
  context: Partial<ErrorContext> = {}
): AnalysisError {
  // Already classified
  if (error instanceof AnalysisError) {
    return error;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Timeout patterns
    if (message.includes("timeout") || message.includes("timed out") || message.includes("etimedout")) {
      return new ApiError(
        AnalysisErrorCode.API_TIMEOUT,
        error.message,
        context,
        undefined,
        undefined,
        error
      );
    }
    
    // Rate limit patterns
    if (message.includes("rate limit") || message.includes("429") || message.includes("too many requests")) {
      return new ApiError(
        AnalysisErrorCode.API_RATE_LIMIT,
        error.message,
        context,
        429,
        undefined,
        error
      );
    }
    
    // Authentication patterns
    if (message.includes("401") || message.includes("unauthorized") || message.includes("authentication")) {
      return new ApiError(
        AnalysisErrorCode.API_AUTHENTICATION,
        error.message,
        context,
        401,
        undefined,
        error
      );
    }
    
    // Network patterns
    if (message.includes("econnrefused") || message.includes("connection refused")) {
      return new ApiError(
        AnalysisErrorCode.NETWORK_CONNECTION_REFUSED,
        error.message,
        context,
        undefined,
        undefined,
        error
      );
    }
    
    // Service unavailable
    if (message.includes("503") || message.includes("service unavailable")) {
      return new ApiError(
        AnalysisErrorCode.API_SERVICE_UNAVAILABLE,
        error.message,
        context,
        503,
        undefined,
        error
      );
    }
    
    // Default to internal error
    return new AnalysisError(
      getErrorMetadata(AnalysisErrorCode.SYSTEM_INTERNAL_ERROR, error.message),
      context,
      error
    );
  }

  // Handle non-Error objects
  const errorMessage = typeof error === "string" ? error : JSON.stringify(error);
  return new AnalysisError(
    getErrorMetadata(AnalysisErrorCode.SYSTEM_INTERNAL_ERROR, errorMessage),
    context
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  getErrorMetadata,
};
