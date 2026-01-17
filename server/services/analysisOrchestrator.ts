import { Tier, getTierPrice, TIER_CONFIGS, isMultiPartTier } from "../../shared/pricing";
import { generateSingleAnalysis, generateMultiPartAnalysis, generateInsiderAnalysis } from "./perplexityService";
import { sendValidateStrategyEmail, isEmailConfigured } from "./emailService";
import {
    AnalysisError,
    ErrorCategory,
    TIER_ERROR_CONFIGS,
    classifyError,
} from "./errorHandling";
import {
    perplexityCircuitBreaker,
    CircuitState
} from "./retryStrategy";
import {
    notifyAnalysisFailed,
} from "./errorNotifications";
import {
    createPartialResultsManager,
    PartialResultsManager,
    logAnalysisStart,
    logPartComplete,
    logAnalysisComplete,
    logError,
    recordMetric,
    addToRetryQueue,
    RetryPriority,
    withRetry
} from "./analysisHelpers";
import {
    updateAnalysisSessionStatus,
    updateAnalysisResult,
    getAnalysisSessionById,
} from "../db";
import { notifyOwner } from "../_core/notification";
import {
    trackAnalysisStart,
    trackPartStart,
    trackPartComplete,
    trackAnalysisComplete,
    trackAnalysisFailure,
    trackPartialSuccess,
    trackQueuedForRetry,
} from "./safeOperationTracker";

// Type definition for resumeConfig
export interface ResumeConfig {
    resumeFromPart?: number;
    initialHandoffState?: string;
    previousParts?: Record<string, string>;
}

// Background analysis function with comprehensive error handling
export async function startAnalysisInBackground(
    sessionId: string,
    problemStatement: string,
    tier: Tier,
    email?: string | null,
    resumeConfig?: ResumeConfig
) {
    const startTime = Date.now();
    const tierConfig = TIER_ERROR_CONFIGS[tier];
    let partialResultsManager: PartialResultsManager | null = null;

    // Log analysis start (or resume)
    if (resumeConfig) {
        console.log(`[Analysis] RESUMING ${tier} analysis for session ${sessionId} from part ${resumeConfig.resumeFromPart}`);
        // We don't call trackAnalysisStart here because it's already an existing operation
    } else {
        logAnalysisStart(sessionId, tier, problemStatement);
        // Track analysis start in Operations Center (fire-and-forget, never blocks)
        trackAnalysisStart(sessionId, tier, "user");
    }

    // Check circuit breaker state before starting
    const circuitState = perplexityCircuitBreaker.getState();
    if (circuitState === CircuitState.OPEN) {
        console.warn(`[Analysis] Circuit breaker OPEN - queueing session ${sessionId} for retry`);

        // Add to retry queue instead of failing immediately
        await addToRetryQueue({
            sessionId,
            tier,
            problemStatement,
            email: email || undefined,
            retryCount: 0,
            priority: tier === 'full' ? RetryPriority.HIGH : tier === 'medium' ? RetryPriority.MEDIUM : RetryPriority.LOW,
            createdAt: new Date(),
            lastError: 'Circuit breaker open - API temporarily unavailable',
        });

        // Track queued for retry (fire-and-forget)
        trackQueuedForRetry(sessionId, 'Circuit breaker open - API temporarily unavailable');

        // Notify user about delay (circuit breaker open)
        if (email) {
            // Use classifyError to create proper AnalysisError
            const circuitError = classifyError(new Error('API temporarily unavailable - your analysis is queued'), { sessionId, tier });
            await notifyAnalysisFailed(sessionId, tier, email, true, circuitError);
        }

        await updateAnalysisSessionStatus(sessionId, "processing");
        return;
    }

    try {
        console.log(`[Analysis] Starting ${tier} analysis for session ${sessionId}`);

        if (isMultiPartTier(tier)) {
            // Syndicate tier: 6-part comprehensive APEX analysis with error handling
            const totalParts = 6;
            partialResultsManager = createPartialResultsManager(sessionId, tier, totalParts);

            const result = await generateMultiPartAnalysis(problemStatement, {
                onPartComplete: async (partNum, content, handoffState) => {
                    console.log(`[Analysis] Part ${partNum} complete for session ${sessionId}`);
                    logPartComplete(sessionId, partNum, totalParts);

                    // Track part start for next part (fire-and-forget)
                    if (partNum < totalParts) {
                        trackPartStart(sessionId, partNum + 1);
                    }

                    // Track successful part completion (fire-and-forget)
                    trackPartComplete(sessionId, partNum, content, Date.now() - startTime, handoffState);

                    // Track successful part
                    partialResultsManager?.markPartComplete(partNum, content);

                    // Support all 6 parts for Syndicate tier
                    const partKey = `part${partNum}` as "part1" | "part2" | "part3" | "part4" | "part5" | "part6";
                    await updateAnalysisResult(sessionId, { [partKey]: content });

                    // Record metric
                    recordMetric(sessionId, tier, 'part_complete', Date.now() - startTime);
                },
                onComplete: async (result) => {
                    await updateAnalysisResult(sessionId, {
                        fullMarkdown: result.fullMarkdown,
                        generatedAt: new Date(result.generatedAt),
                    });
                    await updateAnalysisSessionStatus(sessionId, "completed");

                    // Log completion
                    const duration = Date.now() - startTime;
                    logAnalysisComplete(sessionId, tier, duration, true);
                    recordMetric(sessionId, tier, 'success', duration);

                    // Track analysis completion (fire-and-forget)
                    trackAnalysisComplete(sessionId, duration);

                    console.log(`[Analysis] 6-part Syndicate analysis complete for session ${sessionId} in ${duration}ms`);

                    // Send success email notification
                    if (email && isEmailConfigured()) {
                        await sendValidateStrategyEmail({
                            to: email,
                            userName: email.split('@')[0],
                            magicLinkUrl: `${process.env.VITE_APP_URL || ''}/analysis/${sessionId}`,
                            transactionId: sessionId,
                            amount: String(getTierPrice(tier)),
                            currency: 'USD',
                            tier: tier,
                        });
                    }
                },
                onError: async (error) => {
                    console.error(`[Analysis] Error for session ${sessionId}:`, error);

                    // Check if we have partial results to save
                    if (partialResultsManager) {
                        const completedParts = partialResultsManager.getCompletedParts();
                        const completionPercentage = partialResultsManager.getCompletionPercentage();

                        // Check if we have minimum parts for partial success
                        const minParts = tierConfig.minPartsForPartialSuccess;
                        const minPercentage = (minParts / tierConfig.expectedParts) * 100;
                        if (completionPercentage >= minPercentage) {
                            // We have enough for partial delivery
                            console.log(`[Analysis] Saving partial results (${completionPercentage}%) for session ${sessionId}`);

                            const partialMarkdown = partialResultsManager.generatePartialMarkdown();
                            await updateAnalysisResult(sessionId, {
                                fullMarkdown: partialMarkdown,
                                generatedAt: new Date(),
                            });
                            // Mark as completed even if partial (user can still view results)
                            await updateAnalysisSessionStatus(sessionId, "completed");

                            // Log partial success
                            console.log(`[Analysis] Partial success: ${completedParts.length}/${totalParts} parts completed for session ${sessionId}`);

                            // Track partial success (fire-and-forget)
                            trackPartialSuccess(sessionId, completedParts.length, totalParts);

                            logAnalysisComplete(sessionId, tier, Date.now() - startTime, false, completionPercentage);
                            return;
                        }
                    }

                    // Track failure before adding to retry queue (fire-and-forget)
                    const failedPartSyndicate = partialResultsManager ? partialResultsManager.getCompletedParts().length + 1 : 1;
                    trackAnalysisFailure(sessionId, error instanceof Error ? error : new Error(String(error)), failedPartSyndicate);

                    // Full failure - add to retry queue
                    await handleAnalysisFailure(sessionId, tier, problemStatement, email, error, startTime);
                },
            },
                {
                    startFromPart: resumeConfig?.resumeFromPart || 1,
                    initialAccumulatedState: resumeConfig?.initialHandoffState || "",
                    previousParts: resumeConfig?.previousParts || {}
                });
        } else if (tier === "medium") {
            // Insider tier: 2-part strategic blueprint with error handling
            const totalParts = 2;
            partialResultsManager = createPartialResultsManager(sessionId, tier, totalParts);

            console.log(`[Analysis] Starting Insider 2-part analysis for session ${sessionId}`);

            const result = await generateInsiderAnalysis(problemStatement, {
                onPartComplete: async (partNum, content, handoffState) => {
                    console.log(`[Analysis] Insider Part ${partNum} complete for session ${sessionId}`);
                    logPartComplete(sessionId, partNum, totalParts);

                    // Track part start for next part (fire-and-forget)
                    if (partNum < totalParts) {
                        trackPartStart(sessionId, partNum + 1);
                    }

                    // Track successful part completion (fire-and-forget)
                    trackPartComplete(sessionId, partNum, content, Date.now() - startTime, handoffState);

                    partialResultsManager?.markPartComplete(partNum, content);

                    const partKey = `part${partNum}` as "part1" | "part2";
                    await updateAnalysisResult(sessionId, { [partKey]: content });

                    recordMetric(sessionId, tier, 'part_complete', Date.now() - startTime);
                },
                onComplete: async (result) => {
                    await updateAnalysisResult(sessionId, {
                        fullMarkdown: result.fullMarkdown,
                        generatedAt: new Date(result.generatedAt),
                    });
                    await updateAnalysisSessionStatus(sessionId, "completed");

                    const duration = Date.now() - startTime;
                    logAnalysisComplete(sessionId, tier, duration, true);
                    recordMetric(sessionId, tier, 'success', duration);

                    // Track analysis completion (fire-and-forget)
                    trackAnalysisComplete(sessionId, duration);

                    console.log(`[Analysis] 2-part Insider analysis complete for session ${sessionId} in ${duration}ms`);

                    // Send email notification
                    if (email && isEmailConfigured()) {
                        await sendValidateStrategyEmail({
                            to: email,
                            userName: email.split('@')[0],
                            magicLinkUrl: `${process.env.VITE_APP_URL || ''}/analysis/${sessionId}`,
                            transactionId: sessionId,
                            amount: String(getTierPrice(tier)),
                            currency: 'USD',
                            tier: tier,
                        });
                    }
                },
                onError: async (error) => {
                    console.error(`[Analysis] Insider error for session ${sessionId}:`, error);

                    // Check for partial results (at least part 1)
                    if (partialResultsManager) {
                        const completedParts = partialResultsManager.getCompletedParts();
                        const completionPercentage = partialResultsManager.getCompletionPercentage();

                        // Check if we have minimum parts for partial success
                        const minParts = tierConfig.minPartsForPartialSuccess;
                        const minPercentage = (minParts / tierConfig.expectedParts) * 100;
                        if (completionPercentage >= minPercentage) {
                            console.log(`[Analysis] Saving partial Insider results (${completionPercentage}%) for session ${sessionId}`);

                            const partialMarkdown = partialResultsManager.generatePartialMarkdown();
                            await updateAnalysisResult(sessionId, {
                                fullMarkdown: partialMarkdown,
                                generatedAt: new Date(),
                            });
                            // Mark as completed even if partial (user can still view results)
                            await updateAnalysisSessionStatus(sessionId, "completed");

                            // Log partial success
                            console.log(`[Analysis] Partial success: ${completedParts.length}/${totalParts} parts completed for session ${sessionId}`);

                            // Track partial success (fire-and-forget)
                            trackPartialSuccess(sessionId, completedParts.length, totalParts);

                            logAnalysisComplete(sessionId, tier, Date.now() - startTime, false, completionPercentage);
                            return;
                        }
                    }

                    // Track failure before adding to retry queue (fire-and-forget)
                    const failedPartInsider = partialResultsManager ? partialResultsManager.getCompletedParts().length + 1 : 1;
                    trackAnalysisFailure(sessionId, error instanceof Error ? error : new Error(String(error)), failedPartInsider);

                    await handleAnalysisFailure(sessionId, tier, problemStatement, email, error, startTime);
                },
            },
                {
                    startFromPart: resumeConfig?.resumeFromPart || 1,
                    initialAccumulatedState: resumeConfig?.initialHandoffState || "",
                    previousParts: resumeConfig?.previousParts || {}
                });
        } else {
            // Observer tier: Single analysis with retry wrapper
            console.log(`[Analysis] Starting Observer single analysis for session ${sessionId}`);

            const result = await withRetry(
                async () => generateSingleAnalysis(problemStatement, "standard"),
                {
                    maxRetries: tierConfig.maxRetries,
                    baseDelay: tierConfig.baseDelay,
                    maxDelay: 30000,
                    onRetry: (attempt, error) => {
                        console.log(`[Analysis] Observer retry ${attempt}/${tierConfig.maxRetries} for session ${sessionId}: ${error.message}`);
                        recordMetric(sessionId, tier, 'retry', Date.now() - startTime);
                    },
                }
            );

            await updateAnalysisResult(sessionId, {
                singleResult: result.content,
                generatedAt: new Date(result.generatedAt),
            });
            await updateAnalysisSessionStatus(sessionId, "completed");

            const duration = Date.now() - startTime;
            logAnalysisComplete(sessionId, tier, duration, true);
            recordMetric(sessionId, tier, 'success', duration);

            // Track analysis completion (fire-and-forget) - Observer is single part
            trackPartComplete(sessionId, 1, result.content, duration);
            trackAnalysisComplete(sessionId, duration);

            console.log(`[Analysis] Observer analysis complete for session ${sessionId} in ${duration}ms`);

            // Send email notification
            if (email && isEmailConfigured()) {
                await sendValidateStrategyEmail({
                    to: email,
                    userName: email.split('@')[0],
                    magicLinkUrl: `${process.env.VITE_APP_URL || ''}/analysis/${sessionId}`,
                    transactionId: sessionId,
                    amount: String(getTierPrice(tier)),
                    currency: 'USD',
                    tier: tier,
                });
            }
        }
    } catch (error) {
        // Track failure in outer catch (fire-and-forget)
        trackAnalysisFailure(sessionId, error instanceof Error ? error : new Error(String(error)), 1);

        await handleAnalysisFailure(sessionId, tier, problemStatement, email, error, startTime);
    }
}

// Helper function to handle analysis failures with retry queue and notifications
export async function handleAnalysisFailure(
    sessionId: string,
    tier: Tier,
    problemStatement: string,
    email: string | null | undefined,
    error: unknown,
    startTime: number
) {
    const tierConfig = TIER_ERROR_CONFIGS[tier];
    const duration = Date.now() - startTime;

    // Create structured error using classifyError
    const analysisError = error instanceof AnalysisError
        ? error
        : classifyError(error, { sessionId, tier });

    // Log the error
    logError(analysisError, { sessionId, tier, duration });
    recordMetric(sessionId, tier, 'failure', duration);

    console.error(`[Analysis] Failed for session ${sessionId}:`, analysisError.message);

    // Check if we should add to retry queue (recoverable errors only)
    const isRetryable = analysisError.isRetryable &&
        analysisError.category !== ErrorCategory.FATAL;

    if (isRetryable) {
        // Add to retry queue for automatic retry
        await addToRetryQueue({
            sessionId,
            tier,
            problemStatement,
            email: email || undefined,
            retryCount: 0,
            priority: tier === 'full' ? RetryPriority.HIGH : tier === 'medium' ? RetryPriority.MEDIUM : RetryPriority.LOW,
            createdAt: new Date(),
            lastError: analysisError.message,
        });

        await updateAnalysisSessionStatus(sessionId, "processing");

        // Notify user that analysis is queued for retry
        if (email) {
            await notifyAnalysisFailed(sessionId, tier, email, true, analysisError);
        }

        console.log(`[Analysis] Session ${sessionId} queued for retry`);
    } else {
        // Non-retryable error - mark as failed
        await updateAnalysisSessionStatus(sessionId, "failed");

        // Notify user of failure
        if (email) {
            await notifyAnalysisFailed(sessionId, tier, email, false, analysisError);
        }

        // Alert admin for high-value failures
        if (tier === 'full' || tier === 'medium') {
            await notifyOwner({
                title: `Analysis Failed - ${tier.toUpperCase()} Tier`,
                content: `Session: ${sessionId}\nTier: ${tier}\nError: ${analysisError.message}\nCategory: ${analysisError.category}\n\nThis may require manual intervention or refund.`,
            });
        }
    }
}
