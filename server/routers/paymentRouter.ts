/**
 * Payment Router
 * Handles all payment processing (NOWPayments, PayPal) and post-payment analysis triggering
 * 
 * SECURITY CONTROLS:
 * - Payment validation
 * - Deduplication/Idempotency checks
 * - Secure status updates
 */

import { publicProcedure, router } from "../_core/trpc";
import { config } from "../_core/config";
import { logger } from "../_core/logger";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getTierConfig, getTierPrice } from "../../shared/pricing";
import {
    createPurchase,
    getPurchaseBySessionId,
    updatePurchaseStatus,
    getAnalysisSessionById,
    updateAnalysisSessionStatus,
    createAnalysisResult,
} from "../db";
import { notifyOwner } from "../_core/notification";
import { startAnalysisInBackground } from "../services/analysisOrchestrator";

// Zod schemas
const tierSchema = z.enum(["standard", "medium", "full"]);

export const paymentRouter = router({
    // NOWPayments - Primary crypto payment method
    createNowPaymentsInvoice: publicProcedure
        .input(z.object({
            sessionId: z.string(),
            tier: tierSchema,
            problemStatement: z.string().min(10).max(10000),
            email: z.string().email().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
            const { createInvoice, isNowPaymentsConfigured } = await import("../services/nowPaymentsService");

            if (!isNowPaymentsConfigured()) {
                throw new TRPCError({ code: "PRECONDITION_FAILED", message: "NOWPayments is not configured" });
            }

            const appUrl = config.VITE_APP_URL;
            const tierConfig = getTierConfig(input.tier);

            const invoice = await createInvoice({
                priceAmount: getTierPrice(input.tier),
                priceCurrency: 'usd',
                orderId: input.sessionId,
                orderDescription: `APEX Analysis - ${tierConfig?.displayName || input.tier} Tier`,
                ipnCallbackUrl: `${appUrl}/api/webhooks/nowpayments`,
                successUrl: `${appUrl}/payment-success/${input.sessionId}`,
                cancelUrl: `${appUrl}/checkout/${input.sessionId}`,
            });

            // Create purchase record
            await createPurchase({
                sessionId: input.sessionId,
                userId: ctx.user?.id,
                tier: input.tier,
                amountUsd: getTierPrice(input.tier).toString(),
                paymentMethod: "nowpayments",
                paymentStatus: "pending",
            });

            return {
                invoiceId: invoice.id,
                invoiceUrl: invoice.invoice_url,
            };
        }),

    // Get NOWPayments payment status
    getNowPaymentsStatus: publicProcedure
        .input(z.object({ paymentId: z.string() }))
        .query(async ({ input }) => {
            const { getPaymentStatus } = await import("../services/nowPaymentsService");
            const status = await getPaymentStatus(input.paymentId);
            return status;
        }),

    // PayPal order creation
    createPayPalOrder: publicProcedure
        .input(z.object({
            sessionId: z.string(),
            tier: tierSchema,
            problemStatement: z.string().min(10).max(10000),
        }))
        .mutation(async ({ input, ctx }) => {
            const { createOrder: createPayPalOrder, isPayPalConfigured } = await import("../services/paypalService");

            if (!isPayPalConfigured()) {
                throw new TRPCError({ code: "PRECONDITION_FAILED", message: "PayPal is not configured" });
            }

            const result = await createPayPalOrder(input.tier, input.sessionId, input.problemStatement);

            if (!result.success) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
            }

            // Create purchase record
            await createPurchase({
                sessionId: input.sessionId,
                userId: ctx.user?.id,
                tier: input.tier,
                amountUsd: getTierPrice(input.tier).toString(),
                paymentMethod: "paypal",
                paymentStatus: "pending",
                paypalOrderId: result.orderId,
            });

            return {
                orderId: result.orderId,
                approvalUrl: result.approvalUrl,
            };
        }),

    // PayPal order capture (after user approval)
    capturePayPalOrder: publicProcedure
        .input(z.object({
            orderId: z.string(),
            sessionId: z.string(),
        }))
        .mutation(async ({ input }) => {
            // SECURITY: Idempotency check - prevent double-capture on network retry/double-click
            const existingPurchase = await getPurchaseBySessionId(input.sessionId);
            if (existingPurchase?.paymentStatus === "completed") {
                logger.info(`[PayPal] Idempotency: session ${input.sessionId} already completed`);
                return {
                    success: true,
                    captureId: "already_captured",
                    duplicate: true,
                };
            }

            const { captureOrder: capturePayPalOrder } = await import("../services/paypalService");
            const result = await capturePayPalOrder(input.orderId);

            if (!result.success) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
            }

            // Update purchase status
            await updatePurchaseStatus(input.sessionId, "completed");

            // Notify owner
            const purchase = await getPurchaseBySessionId(input.sessionId);
            if (purchase) {
                await notifyOwner({
                    title: "New PayPal Purchase",
                    content: `Tier: ${purchase.tier}\nAmount: $${purchase.amountUsd}\nSession: ${input.sessionId}`,
                });
            }

            return {
                success: true,
                captureId: result.captureId,
            };
        }),

    getStatus: publicProcedure
        .input(z.object({ sessionId: z.string() }))
        .query(async ({ input }) => {
            const purchase = await getPurchaseBySessionId(input.sessionId);
            return purchase ? { status: purchase.paymentStatus } : null;
        }),

    // Called after successful payment to trigger analysis
    confirmAndStartAnalysis: publicProcedure
        .input(z.object({ sessionId: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const session = await getAnalysisSessionById(input.sessionId);
            if (!session) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
            }

            // SECURITY: Prevent duplicate analysis starts (race condition/double-submit protection)
            if (session.status !== "pending_payment") {
                logger.info(`[Analysis] Deduplication: session ${input.sessionId} already has status "${session.status}"`);
                return { status: session.status as string };
            }

            const purchase = await getPurchaseBySessionId(input.sessionId);
            if (!purchase || purchase.paymentStatus !== "completed") {
                throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Payment not completed" });
            }

            // Update session status
            await updateAnalysisSessionStatus(input.sessionId, "processing");

            // Create initial result record
            await createAnalysisResult({
                sessionId: input.sessionId,
                userId: ctx.user?.id,
                tier: session.tier,
                problemStatement: session.problemStatement,
            });

            // Start analysis (async)
            startAnalysisInBackground(input.sessionId, session.problemStatement, session.tier, session.email);

            // Notify owner of new purchase
            const tierConfig = getTierConfig(session.tier);
            await notifyOwner({
                title: `New ${tierConfig?.displayName || session.tier} Purchase`,
                content: `A new analysis has been purchased.\n\nTier: ${tierConfig?.displayName}\nAmount: $${getTierPrice(session.tier)}\nProblem: ${session.problemStatement.substring(0, 200)}...`,
            });

            return { status: "processing" };
        }),
});
