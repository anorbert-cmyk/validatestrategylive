/**
 * Error Monitoring & Logging Module
 * 
 * Provides comprehensive monitoring, structured logging, and alerting
 * for the analysis pipeline. Tracks metrics, detects anomalies, and
 * provides real-time visibility into system health.
 * 
 * Monitoring Architecture:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                      MONITORING PIPELINE                                │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │   Event → Logger → Metrics Collector → Anomaly Detector → Alert        │
 * │              │              │                   │                       │
 * │              ↓              ↓                   ↓                       │
 * │         Log Storage    Time Series DB    Alert Manager                 │
 * │              │              │                   │                       │
 * │              └──────────────┴───────────────────┘                       │
 * │                             │                                           │
 * │                             ↓                                           │
 * │                      Admin Dashboard                                    │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { Tier } from "../../shared/pricing";
import { AnalysisError, ErrorCategory, AnalysisErrorCode } from "./errorHandling";
import { CircuitState, perplexityCircuitBreaker } from "./retryStrategy";

// ============================================================================
// TYPES
// ============================================================================

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  sessionId?: string;
  tier?: Tier;
  errorCode?: AnalysisErrorCode;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface AnalysisMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  partialSuccesses: number;
  averageDuration: number;
  p95Duration: number;
  errorsByCode: Record<string, number>;
  errorsByCategory: Record<string, number>;
  requestsByTier: Record<Tier, number>;
  successRateByTier: Record<Tier, number>;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  circuitBreaker: CircuitState;
  errorRate: number;
  avgResponseTime: number;
  activeRetries: number;
  lastError?: {
    code: string;
    message: string;
    timestamp: Date;
  };
}

// ============================================================================
// IN-MEMORY STORAGE (Production would use proper storage)
// ============================================================================

const logs: LogEntry[] = [];
const MAX_LOGS = 10000;

const metrics: {
  requests: Array<{
    timestamp: Date;
    tier: Tier;
    success: boolean;
    duration: number;
    errorCode?: string;
    errorCategory?: string;
  }>;
} = {
  requests: [],
};
const MAX_METRICS = 10000;
const METRICS_WINDOW_MS = 3600000; // 1 hour

// ============================================================================
// STRUCTURED LOGGER
// ============================================================================

class StructuredLogger {
  private category: string;

  constructor(category: string) {
    this.category = category;
  }

  private log(level: LogLevel, message: string, data?: Partial<LogEntry>): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category: this.category,
      message,
      ...data,
    };

    // Store in memory
    logs.push(entry);
    if (logs.length > MAX_LOGS) {
      logs.shift();
    }

    // Console output with structured format
    const logData = {
      ts: entry.timestamp.toISOString(),
      level: entry.level,
      cat: entry.category,
      msg: entry.message,
      ...(entry.sessionId && { sid: entry.sessionId }),
      ...(entry.tier && { tier: entry.tier }),
      ...(entry.errorCode && { err: entry.errorCode }),
      ...(entry.duration && { dur: `${entry.duration}ms` }),
      ...(entry.metadata && { meta: entry.metadata }),
    };

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(JSON.stringify(logData));
        break;
      case LogLevel.INFO:
        console.info(JSON.stringify(logData));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(logData));
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(JSON.stringify(logData));
        break;
    }
  }

  debug(message: string, data?: Partial<LogEntry>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: Partial<LogEntry>): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: Partial<LogEntry>): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, data?: Partial<LogEntry>): void {
    this.log(LogLevel.ERROR, message, data);
  }

  fatal(message: string, data?: Partial<LogEntry>): void {
    this.log(LogLevel.FATAL, message, data);
  }
}

// Create loggers for different components
export const analysisLogger = new StructuredLogger("analysis");
export const retryLogger = new StructuredLogger("retry");
export const paymentLogger = new StructuredLogger("payment");
export const notificationLogger = new StructuredLogger("notification");

// ============================================================================
// METRICS COLLECTOR
// ============================================================================

export function recordAnalysisRequest(
  tier: Tier,
  success: boolean,
  duration: number,
  error?: AnalysisError
): void {
  const record = {
    timestamp: new Date(),
    tier,
    success,
    duration,
    errorCode: error?.code,
    errorCategory: error?.category,
  };

  metrics.requests.push(record);
  if (metrics.requests.length > MAX_METRICS) {
    metrics.requests.shift();
  }

  // Log the request
  if (success) {
    analysisLogger.info("Analysis completed", {
      tier,
      duration,
    });
  } else {
    analysisLogger.error("Analysis failed", {
      tier,
      duration,
      errorCode: error?.code,
      metadata: {
        errorCategory: error?.category,
        errorMessage: error?.message,
      },
    });
  }
}

export function recordPartCompletion(
  sessionId: string,
  tier: Tier,
  partNumber: number,
  duration: number
): void {
  analysisLogger.info(`Part ${partNumber} completed`, {
    sessionId,
    tier,
    duration,
    metadata: { partNumber },
  });
}

export function recordRetryAttempt(
  sessionId: string,
  tier: Tier,
  attempt: number,
  error: AnalysisError,
  delay: number
): void {
  retryLogger.warn(`Retry attempt ${attempt}`, {
    sessionId,
    tier,
    errorCode: error.code,
    metadata: {
      attempt,
      delay,
      errorMessage: error.message,
    },
  });
}

// ============================================================================
// METRICS AGGREGATION
// ============================================================================

export function getMetrics(windowMs: number = METRICS_WINDOW_MS): AnalysisMetrics {
  const cutoff = new Date(Date.now() - windowMs);
  const recentRequests = metrics.requests.filter((r) => r.timestamp > cutoff);

  const totalRequests = recentRequests.length;
  const successfulRequests = recentRequests.filter((r) => r.success).length;
  const failedRequests = recentRequests.filter((r) => !r.success).length;

  // Calculate durations
  const durations = recentRequests.map((r) => r.duration).sort((a, b) => a - b);
  const averageDuration =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;
  const p95Duration =
    durations.length > 0
      ? durations[Math.floor(durations.length * 0.95)] || durations[durations.length - 1]
      : 0;

  // Count errors by code
  const errorsByCode: Record<string, number> = {};
  const errorsByCategory: Record<string, number> = {};
  for (const req of recentRequests.filter((r) => !r.success)) {
    if (req.errorCode) {
      errorsByCode[req.errorCode] = (errorsByCode[req.errorCode] || 0) + 1;
    }
    if (req.errorCategory) {
      errorsByCategory[req.errorCategory] =
        (errorsByCategory[req.errorCategory] || 0) + 1;
    }
  }

  // Count by tier
  const requestsByTier: Record<Tier, number> = {
    standard: 0,
    medium: 0,
    full: 0,
  };
  const successByTier: Record<Tier, number> = {
    standard: 0,
    medium: 0,
    full: 0,
  };

  for (const req of recentRequests) {
    requestsByTier[req.tier]++;
    if (req.success) {
      successByTier[req.tier]++;
    }
  }

  const successRateByTier: Record<Tier, number> = {
    standard: requestsByTier.standard > 0 ? successByTier.standard / requestsByTier.standard : 1,
    medium: requestsByTier.medium > 0 ? successByTier.medium / requestsByTier.medium : 1,
    full: requestsByTier.full > 0 ? successByTier.full / requestsByTier.full : 1,
  };

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    partialSuccesses: 0, // Would need additional tracking
    averageDuration: Math.round(averageDuration),
    p95Duration: Math.round(p95Duration),
    errorsByCode,
    errorsByCategory,
    requestsByTier,
    successRateByTier,
  };
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export function getHealthStatus(): HealthStatus {
  const recentMetrics = getMetrics(300000); // Last 5 minutes
  const errorRate =
    recentMetrics.totalRequests > 0
      ? recentMetrics.failedRequests / recentMetrics.totalRequests
      : 0;

  const circuitState = perplexityCircuitBreaker.getState();

  // Find last error
  const lastErrorLog = [...logs]
    .reverse()
    .find((l) => l.level === LogLevel.ERROR || l.level === LogLevel.FATAL);

  let status: "healthy" | "degraded" | "unhealthy";
  if (circuitState === CircuitState.OPEN || errorRate > 0.5) {
    status = "unhealthy";
  } else if (circuitState === CircuitState.HALF_OPEN || errorRate > 0.2) {
    status = "degraded";
  } else {
    status = "healthy";
  }

  return {
    status,
    circuitBreaker: circuitState,
    errorRate: Math.round(errorRate * 100) / 100,
    avgResponseTime: recentMetrics.averageDuration,
    activeRetries: 0, // Would need to track from retry queue
    lastError: lastErrorLog
      ? {
          code: lastErrorLog.errorCode || "UNKNOWN",
          message: lastErrorLog.message,
          timestamp: lastErrorLog.timestamp,
        }
      : undefined,
  };
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

interface AnomalyThresholds {
  errorRateThreshold: number;
  responseTimeThreshold: number;
  consecutiveFailuresThreshold: number;
}

const DEFAULT_THRESHOLDS: AnomalyThresholds = {
  errorRateThreshold: 0.3, // 30% error rate
  responseTimeThreshold: 120000, // 2 minutes
  consecutiveFailuresThreshold: 5,
};

let consecutiveFailures = 0;

export function detectAnomalies(
  thresholds: AnomalyThresholds = DEFAULT_THRESHOLDS
): {
  hasAnomalies: boolean;
  anomalies: string[];
} {
  const health = getHealthStatus();
  const metrics = getMetrics(300000); // Last 5 minutes
  const anomalies: string[] = [];

  // Check error rate
  if (health.errorRate > thresholds.errorRateThreshold) {
    anomalies.push(
      `High error rate: ${Math.round(health.errorRate * 100)}% (threshold: ${
        thresholds.errorRateThreshold * 100
      }%)`
    );
  }

  // Check response time
  if (metrics.averageDuration > thresholds.responseTimeThreshold) {
    anomalies.push(
      `Slow response time: ${Math.round(metrics.averageDuration / 1000)}s (threshold: ${
        thresholds.responseTimeThreshold / 1000
      }s)`
    );
  }

  // Check circuit breaker
  if (health.circuitBreaker === CircuitState.OPEN) {
    anomalies.push("Circuit breaker is OPEN - API is unavailable");
  }

  // Check consecutive failures
  if (consecutiveFailures >= thresholds.consecutiveFailuresThreshold) {
    anomalies.push(
      `${consecutiveFailures} consecutive failures detected`
    );
  }

  return {
    hasAnomalies: anomalies.length > 0,
    anomalies,
  };
}

export function recordSuccess(): void {
  consecutiveFailures = 0;
}

export function recordFailure(): void {
  consecutiveFailures++;
}

// ============================================================================
// LOG QUERYING
// ============================================================================

export function queryLogs(options: {
  level?: LogLevel;
  category?: string;
  sessionId?: string;
  since?: Date;
  limit?: number;
}): LogEntry[] {
  let filtered = [...logs];

  if (options.level) {
    filtered = filtered.filter((l) => l.level === options.level);
  }

  if (options.category) {
    filtered = filtered.filter((l) => l.category === options.category);
  }

  if (options.sessionId) {
    filtered = filtered.filter((l) => l.sessionId === options.sessionId);
  }

  if (options.since) {
    filtered = filtered.filter((l) => l.timestamp >= options.since!);
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

// ============================================================================
// ADMIN DASHBOARD DATA
// ============================================================================

export interface DashboardData {
  health: HealthStatus;
  metrics: AnalysisMetrics;
  anomalies: { hasAnomalies: boolean; anomalies: string[] };
  recentErrors: LogEntry[];
  circuitBreakerStats: {
    state: CircuitState;
    failures: number;
    recentFailures: number;
    resetTime: Date | null;
  };
}

export function getDashboardData(): DashboardData {
  return {
    health: getHealthStatus(),
    metrics: getMetrics(),
    anomalies: detectAnomalies(),
    recentErrors: queryLogs({ level: LogLevel.ERROR, limit: 10 }),
    circuitBreakerStats: perplexityCircuitBreaker.getStats(),
  };
}
