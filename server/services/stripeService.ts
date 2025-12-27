/**
 * Stripe Payment Service
 * Handles payment intent creation and webhook verification
 */

import Stripe from "stripe";
import { Tier, getTierPrice, getTierConfig } from "../../shared/pricing";

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2025-12-15.clover",
    });
  }
  return stripeClient;
}

export interface CreatePaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

/**
 * Create a Stripe Payment Intent for the given tier
 */
export async function createPaymentIntent(
  tier: Tier,
  sessionId: string,
  problemStatement: string
): Promise<CreatePaymentIntentResult> {
  try {
    const stripe = getStripeClient();
    const priceUsd = getTierPrice(tier);
    const tierConfig = getTierConfig(tier);

    if (!tierConfig) {
      return { success: false, error: "Invalid tier" };
    }

    // Create payment intent (amount in cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(priceUsd * 100),
      currency: "usd",
      metadata: {
        tier,
        sessionId,
        problemStatement: problemStatement.substring(0, 500), // Stripe metadata limit
        tierName: tierConfig.displayName,
      },
      description: `${tierConfig.displayName} - AI Strategic UX Analysis`,
    });

    console.log("[Stripe] Payment intent created:", paymentIntent.id);

    return {
      success: true,
      clientSecret: paymentIntent.client_secret || undefined,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error: any) {
    console.error("[Stripe] Failed to create payment intent:", error);
    return {
      success: false,
      error: error.message || "Failed to create payment",
    };
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe] Webhook secret not configured");
    return null;
  }

  try {
    const stripe = getStripeClient();
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error: any) {
    console.error("[Stripe] Webhook signature verification failed:", error.message);
    return null;
  }
}

/**
 * Retrieve payment intent details
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
  try {
    const stripe = getStripeClient();
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error("[Stripe] Failed to retrieve payment intent:", error);
    return null;
  }
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
