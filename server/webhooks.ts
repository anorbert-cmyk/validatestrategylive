/**
 * Webhook handlers for NOWPayments (primary crypto payment)
 * LemonSqueezy is commented out until company is established
 */

import { Router, Request, Response } from "express";
import {
  verifyIPNSignature,
  parseIPNPayload,
  isPaymentConfirmed,
  isPaymentFailed,
  PAYMENT_STATUS_DESCRIPTIONS
} from "./services/nowPaymentsService";
import {
  updatePurchaseStatus,
  updateAnalysisSessionStatus,
  getAnalysisSessionById,
  createAnalysisResult,
  getPurchaseBySessionId,
  tryMarkWebhookProcessed,
  updatePurchaseWalletAddress,
} from "./db";
import { notifyOwner } from "./_core/notification";
// Imports removed (handled by analysisOrchestrator)

const webhookRouter = Router();

/**
 * NOWPayments IPN (Instant Payment Notification) Webhook Handler
 * This is the PRIMARY payment method for crypto payments
 */
webhookRouter.post("/nowpayments", async (req: Request, res: Response) => {
  console.log("[NOWPayments Webhook] Received IPN callback");

  const signature = req.headers["x-nowpayments-sig"] as string;

  if (!signature) {
    console.error("[NOWPayments Webhook] Missing signature header");
    return res.status(400).json({ error: "Missing signature" });
  }

  // Verify signature
  const payload = req.body;
  if (!verifyIPNSignature(payload, signature)) {
    console.error("[NOWPayments Webhook] Invalid signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    const ipnData = parseIPNPayload(payload);
    const sessionId = ipnData.order_id;
    const paymentStatus = ipnData.payment_status;
    const webhookId = String(ipnData.payment_id);

    console.log(`[NOWPayments Webhook] Payment ${ipnData.payment_id} status: ${paymentStatus} (${PAYMENT_STATUS_DESCRIPTIONS[paymentStatus] || 'Unknown'})`);
    console.log(`[NOWPayments Webhook] Order ID (Session): ${sessionId}`);

    // Only process finished or failed payments
    if (isPaymentConfirmed(paymentStatus)) {
      console.log(`[NOWPayments Webhook] Payment CONFIRMED for session: ${sessionId}`);

      // ATOMIC idempotency check - try to mark as processed first
      // This prevents race conditions when multiple webhooks arrive simultaneously
      const shouldProcess = await tryMarkWebhookProcessed(
        webhookId,
        "nowpayments",
        sessionId,
        String(ipnData.payment_id),
        "completed"
      );

      if (!shouldProcess) {
        console.log(`[NOWPayments Webhook] Webhook already processed (idempotency): ${webhookId}`);
        return res.json({ received: true, status: paymentStatus, duplicate: true });
      }

      // Update purchase status
      await updatePurchaseStatus(sessionId, "completed", new Date());

      // Save wallet address for SIWE authentication (allows user to access history via wallet)
      if (ipnData.pay_address) {
        await updatePurchaseWalletAddress(sessionId, ipnData.pay_address);
        console.log(`[NOWPayments Webhook] Saved wallet address: ${ipnData.pay_address}`);
      }

      // Start the analysis - this is the critical step
      await startAnalysisAfterPayment(sessionId);

      console.log(`[NOWPayments Webhook] Analysis started for session: ${sessionId}`);
    } else if (isPaymentFailed(paymentStatus)) {
      console.log(`[NOWPayments Webhook] Payment FAILED for session: ${sessionId}`);

      // ATOMIC idempotency check for failed payments too
      const shouldProcess = await tryMarkWebhookProcessed(
        webhookId,
        "nowpayments",
        sessionId,
        String(ipnData.payment_id),
        "failed"
      );

      if (!shouldProcess) {
        return res.json({ received: true, status: paymentStatus, duplicate: true });
      }

      await updatePurchaseStatus(sessionId, "failed");
      await updateAnalysisSessionStatus(sessionId, "failed");
    } else {
      // Payment is still pending (waiting, confirming, etc.)
      console.log(`[NOWPayments Webhook] Payment PENDING for session: ${sessionId} - Status: ${paymentStatus}`);
      // Don't start analysis yet - wait for confirmed status
    }

    // Always respond with 200 to acknowledge receipt
    res.json({ received: true, status: paymentStatus });
  } catch (error) {
    console.error("[NOWPayments Webhook] Error processing IPN:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

/**
 * LemonSqueezy Webhook Handler - COMMENTED OUT until company is established
 * Uncomment this when ready to accept credit card payments
 */
/*
webhookRouter.post("/lemonsqueezy", async (req: Request, res: Response) => {
  // Import these when enabling:
  // import { verifyWebhookSignature, parseWebhookEvent } from "./services/lemonSqueezyService";
  
  const signature = req.headers["x-signature"] as string;
  
  if (!signature) {
    console.error("[LemonSqueezy Webhook] Missing signature");
    return res.status(400).json({ error: "Missing signature" });
  }

  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  
  // Verify signature - uncomment when enabling
  // if (!verifyWebhookSignature(rawBody, signature)) {
  //   console.error("[LemonSqueezy Webhook] Invalid signature");
  //   return res.status(400).json({ error: "Invalid signature" });
  // }

  // const event = parseWebhookEvent(rawBody);
  // if (!event) {
  //   console.error("[LemonSqueezy Webhook] Failed to parse event");
  //   return res.status(400).json({ error: "Invalid event payload" });
  // }

  // console.log("[LemonSqueezy Webhook] Received event:", event.meta.event_name);

  try {
    // const customData = event.meta.custom_data;
    // const sessionId = customData?.session_id;

    // if (!sessionId) {
    //   console.error("[LemonSqueezy Webhook] Missing session_id in custom_data");
    //   return res.status(400).json({ error: "Missing session_id" });
    // }

    // switch (event.meta.event_name) {
    //   case "order_created": {
    //     await updatePurchaseStatus(sessionId, "completed", new Date());
    //     await startAnalysisAfterPayment(sessionId);
    //     break;
    //   }
    //   case "order_refunded": {
    //     await updatePurchaseStatus(sessionId, "refunded");
    //     await updateAnalysisSessionStatus(sessionId, "failed");
    //     break;
    //   }
    // }

    res.json({ received: true });
  } catch (error) {
    console.error("[LemonSqueezy Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});
*/

/**
 * Start analysis after successful payment
 * This is called ONLY after payment is fully confirmed
 */
async function startAnalysisAfterPayment(sessionId: string) {
  try {
    const session = await getAnalysisSessionById(sessionId);
    if (!session) {
      console.error("[Analysis] Session not found:", sessionId);
      return;
    }

    // Use the orchestrator to manage the entire analysis lifecycle
    // This centralized handler ensures:
    // 1. Initial status update & Result creation
    // 2. Notification to owner
    // 3. Background processing (6-part Swarm or Single)
    // 4. Progress tracking, Metrics & Completion Emails
    const { startAnalysisInBackground } = await import("./services/analysisOrchestrator");

    // Fire-and-forget background process
    startAnalysisInBackground(
      sessionId,
      session.problemStatement,
      session.tier,
      session.email // Pass email for completion notification
    );

    console.log(`[NOWPayments Webhook] Analysis handed off to orchestrator for session: ${sessionId}`);
  } catch (error) {
    console.error("[Analysis] Failed to start analysis:", error);
    // Fail safe updates
    await updateAnalysisSessionStatus(sessionId, "failed");
  }
}

export default webhookRouter;
