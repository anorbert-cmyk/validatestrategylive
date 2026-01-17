/**
 * Admin Router
 * Handles all administrative operations (stats, wallets, analysis operations)
 * 
 * SECURITY CONTROLS:
 * - Signature verification for ALL endpoints
 * - Challenge-based authentication
 * - Role-based access control (via checkAdminStatus)
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
    checkAdminStatus,
    generateChallenge,
    verifyAdminSignatureWithChallenge,
    verifyAdminSignature,
} from "../services/walletAuthService";
import {
    getAdminStats,
    getTransactionHistory,
    addAdminWallet,
    getAdminWallets,
} from "../db";
import {
    getDashboardData,
    getHealthStatus,
    getMetrics,
} from "../services/errorMonitoring";
import {
    perplexityCircuitBreaker,
} from "../services/retryStrategy";
import {
    getRecentHistoricalMetrics,
    getErrorSummary,
    runHourlyAggregation,
} from "../services/metricsPersistence";
import {
    getFailureRateStats
} from "../services/adminAlerts";
import {
    getQueueStats,
    startRetryQueueProcessor,
    stopRetryQueueProcessor,
    isProcessorRunning,
} from "../services/retryQueueProcessor";
import {
    getOperations,
    getOperationDetails,
    getOperationBySessionId,
    getRetryableOperations,
    pauseOperation,
    resumeOperation,
    cancelOperation,
    triggerRegeneration,
} from "../services/analysisStateMachine";

// Zod schemas
const tierSchema = z.enum(["standard", "medium", "full"]);

export const adminRouter = router({
    checkStatus: publicProcedure
        .input(z.object({ address: z.string() }))
        .query(async ({ input }) => {
            const isAdmin = await checkAdminStatus(input.address);
            return { isAdmin };
        }),

    requestChallenge: publicProcedure
        .input(z.object({ walletAddress: z.string() }))
        .mutation(async ({ input }) => {
            const isAdmin = await checkAdminStatus(input.walletAddress);
            if (!isAdmin) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Not an admin wallet" });
            }
            // Use the walletAuthService to generate and store the challenge
            const { challenge, timestamp } = await generateChallenge(input.walletAddress);
            return { challenge, timestamp };
        }),

    verifySignature: publicProcedure
        .input(z.object({
            walletAddress: z.string(),
            signature: z.string(),
            challenge: z.string(),
            timestamp: z.number(),
        }))
        .mutation(async ({ input }) => {
            // Use the challenge-based verification
            const result = await verifyAdminSignatureWithChallenge(
                input.signature,
                input.challenge,
                input.timestamp,
                input.walletAddress
            );

            if (!result.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: result.error });
            }

            return { success: true };
        }),

    authenticate: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
        }))
        .mutation(async ({ input }) => {
            const result = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!result.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: result.error });
            }

            return { success: true, isAdmin: true };
        }),

    getStats: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
        }))
        .query(async ({ input }) => {
            // Verify admin first
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            const stats = await getAdminStats();
            return stats;
        }),

    getTransactions: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
            limit: z.number().optional().default(100),
        }))
        .query(async ({ input }) => {
            // Verify admin first
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            const transactions = await getTransactionHistory(input.limit);
            return { transactions, total: transactions.length };
        }),

    addWallet: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
            newWalletAddress: z.string(),
            label: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            // Verify admin first
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            await addAdminWallet({
                walletAddress: input.newWalletAddress,
                label: input.label,
            });

            return { success: true };
        }),

    getWallets: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
        }))
        .query(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            return await getAdminWallets();
        }),

    // Get all email subscribers for admin dashboard
    getEmailSubscribers: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
        }))
        .query(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            const { getAllEmailSubscribers, getEmailSubscriberCount } = await import("../db");
            const subscribers = await getAllEmailSubscribers();
            const totalCount = await getEmailSubscriberCount();
            const verifiedCount = subscribers.filter(s => s.isVerified).length;

            return {
                subscribers,
                stats: {
                    total: totalCount,
                    verified: verifiedCount,
                    unverified: totalCount - verifiedCount,
                    verificationRate: totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0
                }
            };
        }),

    // Get error dashboard data for admin
    getErrorDashboard: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
        }))
        .query(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            // Get error dashboard data from monitoring module
            const dashboardData = getDashboardData();
            const healthStatus = getHealthStatus();
            const metrics = getMetrics();

            // Get circuit breaker status
            const circuitBreakerStats = perplexityCircuitBreaker.getStats();

            return {
                dashboard: dashboardData,
                health: healthStatus,
                metrics: metrics,
                circuitBreaker: {
                    state: circuitBreakerStats.state,
                    failures: circuitBreakerStats.failures,
                    recentFailures: circuitBreakerStats.recentFailures,
                    resetTime: circuitBreakerStats.resetTime?.toISOString() || null,
                },
            };
        }),

    // Reset circuit breaker (admin action)
    resetCircuitBreaker: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
        }))
        .mutation(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            // Force reset the circuit breaker
            perplexityCircuitBreaker.forceReset();

            return { success: true, message: "Circuit breaker reset to CLOSED state" };
        }),

    // Get historical metrics (admin action)
    getHistoricalMetrics: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
            hours: z.number().optional().default(24),
        }))
        .query(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            const historicalMetrics = await getRecentHistoricalMetrics(input.hours);
            const failureRateStats = getFailureRateStats();

            return {
                ...historicalMetrics,
                currentFailureRate: failureRateStats,
            };
        }),

    // Get error summary (admin action)
    getErrorSummary: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
            hours: z.number().optional().default(24),
        }))
        .query(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            const end = new Date();
            const start = new Date(end.getTime() - input.hours * 60 * 60 * 1000);
            const errorSummary = await getErrorSummary({ start, end });

            return { errors: errorSummary };
        }),

    // Get retry queue stats (admin action)
    getRetryQueueStats: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
        }))
        .query(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            const queueStats = await getQueueStats();
            const processorRunning = isProcessorRunning();

            return {
                ...queueStats,
                processorRunning,
            };
        }),

    // Start/stop retry queue processor (admin action)
    toggleRetryProcessor: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
            action: z.enum(["start", "stop"]),
        }))
        .mutation(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            if (input.action === "start") {
                startRetryQueueProcessor();
                return { success: true, message: "Retry queue processor started" };
            } else {
                stopRetryQueueProcessor();
                return { success: true, message: "Retry queue processor stopped" };
            }
        }),

    // Trigger hourly metrics aggregation (admin action)
    triggerMetricsAggregation: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
        }))
        .mutation(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            await runHourlyAggregation();
            return { success: true, message: "Hourly metrics aggregation triggered" };
        }),

    // ============ ANALYSIS OPERATIONS CENTER ============

    /**
     * Get all analysis operations with filtering
     * Returns paginated list of operations with their current state
     */
    getAnalysisOperations: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
            state: z.enum(["initialized", "generating", "part_completed", "paused", "failed", "completed", "cancelled"]).optional(),
            tier: tierSchema.optional(),
            limit: z.number().min(1).max(100).default(20),
            offset: z.number().min(0).default(0),
        }))
        .query(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            const operations = await getOperations({
                state: input.state,
                tier: input.tier,
                limit: input.limit,
                offset: input.offset,
            });

            // Get total count for pagination
            const allOps = await getOperations({ state: input.state, tier: input.tier });

            return {
                operations: operations.map(op => ({
                    ...op,
                    progressPercent: op.totalParts > 0
                        ? Math.round((op.completedParts / op.totalParts) * 100)
                        : 0,
                    tierLabel: op.tier === 'standard' ? 'Observer' : op.tier === 'medium' ? 'Insider' : 'Syndicate',
                })),
                total: allOps.length,
                hasMore: input.offset + operations.length < allOps.length,
            };
        }),

    /**
     * Get detailed operation information including events and partial results
     */
    getOperationDetails: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
            operationId: z.string(),
        }))
        .query(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            const details = await getOperationDetails(input.operationId);

            if (!details) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Operation not found" });
            }

            // Calculate additional metrics
            const op = details.operation;
            const completedEvents = details.events.filter(e => e.eventType === 'part_completed');
            const avgPartDuration = completedEvents.length > 0
                ? Math.round(completedEvents.reduce((sum, e) => sum + (e.durationMs || 0), 0) / completedEvents.length)
                : null;

            return {
                operation: {
                    ...op,
                    progressPercent: op.totalParts > 0
                        ? Math.round((op.completedParts / op.totalParts) * 100)
                        : 0,
                    tierLabel: op.tier === 'standard' ? 'Observer' : op.tier === 'medium' ? 'Insider' : 'Syndicate',
                },
                events: details.events.map(e => ({
                    ...e,
                    createdAtFormatted: e.createdAt ? new Date(e.createdAt).toISOString() : null,
                })),
                partialResults: details.partialResults,
                metrics: {
                    avgPartDurationMs: avgPartDuration,
                    totalEventsCount: details.events.length,
                    failureEventsCount: details.events.filter(e =>
                        e.eventType === 'part_failed' || e.eventType === 'operation_failed'
                    ).length,
                },
            };
        }),

    /**
     * Get operation by session ID
     */
    getOperationBySession: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
            sessionId: z.string(),
        }))
        .query(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            const operation = await getOperationBySessionId(input.sessionId);

            if (!operation) {
                return { found: false, operation: null };
            }

            return {
                found: true,
                operation: {
                    ...operation,
                    progressPercent: operation.totalParts > 0
                        ? Math.round((operation.completedParts / operation.totalParts) * 100)
                        : 0,
                    tierLabel: operation.tier === 'standard' ? 'Observer' : operation.tier === 'medium' ? 'Insider' : 'Syndicate',
                },
            };
        }),

    /**
     * Get all failed operations that can be retried
     */
    getRetryableOperations: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
        }))
        .query(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            const operations = await getRetryableOperations();

            return {
                operations: operations.map(op => ({
                    ...op,
                    progressPercent: op.totalParts > 0
                        ? Math.round((op.completedParts / op.totalParts) * 100)
                        : 0,
                    tierLabel: op.tier === 'standard' ? 'Observer' : op.tier === 'medium' ? 'Insider' : 'Syndicate',
                    canRetry: op.retryCount < 5,
                })),
                total: operations.length,
            };
        }),

    /**
     * Pause an active operation (admin action)
     */
    pauseOperation: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
            operationId: z.string(),
            reason: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            const result = await pauseOperation(input.operationId, input.address, input.reason);

            if (!result.success) {
                throw new TRPCError({ code: "BAD_REQUEST", message: `Failed to pause operation: ${result.error}` });
            }

            return {
                success: true,
                message: "Operation paused successfully",
                previousState: result.previousState,
                newState: result.newState,
            };
        }),

    /**
     * Resume a paused operation (admin action)
     */
    resumeOperation: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
            operationId: z.string(),
        }))
        .mutation(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            // 1. Update state in DB
            const result = await resumeOperation(input.operationId, input.address);

            if (!result.success) {
                throw new TRPCError({ code: "BAD_REQUEST", message: `Failed to resume operation: ${result.error}` });
            }

            // 2. Trigger actual processing
            const opDetails = await getOperationDetails(input.operationId);
            if (opDetails) {
                const { startAnalysisInBackground } = await import("../services/analysisOrchestrator");
                const { getAnalysisSessionById } = await import("../db");
                const session = await getAnalysisSessionById(opDetails.operation.sessionId);

                if (session) {
                    startAnalysisInBackground(
                        opDetails.operation.sessionId,
                        session.problemStatement,
                        opDetails.operation.tier,
                        session.email,
                        {
                            resumeFromPart: opDetails.operation.completedParts + 1,
                            initialHandoffState: opDetails.operation.handoffState || "",
                        }
                    );
                }
            }

            return {
                success: true,
                message: "Operation resumed successfully",
                previousState: result.previousState,
                newState: result.newState,
            };
        }),

    /**
     * Cancel an operation (admin action)
     */
    cancelOperation: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
            operationId: z.string(),
            reason: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            const result = await cancelOperation(input.operationId, input.address, input.reason);

            if (!result.success) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Failed to cancel operation." });
            }

            return {
                success: true,
                message: "Operation cancelled successfully",
                previousState: result.previousState,
                newState: result.newState,
            };
        }),

    /**
     * Trigger regeneration of a failed analysis (admin action)
     * Creates a new operation and starts the analysis process
     */
    triggerRegeneration: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
            sessionId: z.string(),
            fromPart: z.number().min(1).max(6).optional(),
        }))
        .mutation(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            // 1. Update state in DB
            const result = await triggerRegeneration(input.sessionId, input.address, {
                fromPart: input.fromPart,
            });

            if (!result.success) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: result.error || "Failed to trigger regeneration"
                });
            }

            // 2. Trigger actual processing
            const session = await getOperationBySessionId(input.sessionId); // Use getOperationBySessionId or getAnalysisSessionById?
            // Actually getAnalysisSessionById is imported from ../db via dynamic import or top level.
            // Let's use dynamic import to be safe and consistent with other methods here.
            const { getAnalysisSessionById } = await import("../db");
            const analysisSession = await getAnalysisSessionById(input.sessionId);

            if (analysisSession) {
                const { startAnalysisInBackground } = await import("../services/analysisOrchestrator");

                // If resuming from a specific part, we might need previous context/handoff state.
                // For now, we rely on the orchestrator or just start fresh if fromPart is 1.
                // If extracting from routers.ts.bak, it passed minimal args:
                startAnalysisInBackground(
                    input.sessionId,
                    analysisSession.problemStatement,
                    analysisSession.tier,
                    analysisSession.email,
                    input.fromPart ? {
                        resumeFromPart: input.fromPart,
                        initialHandoffState: "", // We'd need to fetch this from last operation if essential
                    } : undefined
                );
            }

            return {
                success: true,
                message: `Regeneration triggered successfully`,
                newOperationId: result.newOperationId,
            };
        }),

    /**
     * Get server logs for admin dashboard
     */
    getLogs: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
            level: z.enum(['all', 'error', 'warn', 'info']).optional().default('all'),
            limit: z.number().optional().default(100),
        }))
        .query(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            // Read logs from file
            const fs = await import('fs/promises');
            const path = await import('path');

            try {
                const logsDir = path.join(process.cwd(), 'logs');
                const combinedLogPath = path.join(logsDir, 'combined.log');

                let logs: Array<{ timestamp: string; level: string; message: string; metadata?: any }> = [];

                // Read combined log
                try {
                    const combinedContent = await fs.readFile(combinedLogPath, 'utf-8');
                    const lines = combinedContent.split('\n').filter(line => line.trim());

                    for (const line of lines.slice(-input.limit)) {
                        const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\]: (.*)$/);
                        if (match) {
                            const [, timestamp, level, message] = match;
                            if (input.level === 'all' || level.toLowerCase() === input.level) {
                                logs.push({ timestamp, level: level.toLowerCase(), message });
                            }
                        }
                    }
                } catch (e) {
                    // Log file might not exist yet
                }

                // Sort by timestamp descending (newest first)
                logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                return {
                    logs: logs.slice(0, input.limit),
                    total: logs.length,
                };
            } catch (error) {
                return {
                    logs: [],
                    total: 0,
                    error: 'Failed to read logs',
                };
            }
        }),

    /**
     * Get analysis operations summary for dashboard
     */
    getOperationsSummary: publicProcedure
        .input(z.object({
            signature: z.string(),
            timestamp: z.number(),
            address: z.string(),
        }))
        .query(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            // Get counts by state
            const allOps = await getOperations({});
            const stateCounts = {
                initialized: 0,
                generating: 0,
                part_completed: 0,
                paused: 0,
                failed: 0,
                completed: 0,
                cancelled: 0,
            };

            const tierCounts = {
                standard: 0,
                medium: 0,
                full: 0,
            };

            let totalCompletedParts = 0;
            let totalParts = 0;

            for (const op of allOps) {
                if (op.state in stateCounts) {
                    stateCounts[op.state as keyof typeof stateCounts]++;
                }
                if (op.tier in tierCounts) {
                    tierCounts[op.tier as keyof typeof tierCounts]++;
                }
                totalCompletedParts += op.completedParts;
                totalParts += op.totalParts;
            }

            const activeOperations = stateCounts.initialized + stateCounts.generating + stateCounts.part_completed;
            const failedOperations = stateCounts.failed;
            const successRate = allOps.length > 0
                ? Math.round((stateCounts.completed / allOps.length) * 100)
                : 0;

            return {
                total: allOps.length,
                stateCounts,
                tierCounts,
                activeOperations,
                failedOperations,
                completedOperations: stateCounts.completed,
                successRate,
                overallProgress: totalParts > 0
                    ? Math.round((totalCompletedParts / totalParts) * 100)
                    : 0,
            };
        }),


});
