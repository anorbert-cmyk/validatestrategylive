/**
 * Coinbase Commerce Service
 * Handles cryptocurrency payment creation and webhook verification
 */

import crypto from "crypto";
import { Tier, getTierPrice, getTierConfig } from "../../shared/pricing";

const COINBASE_COMMERCE_API = "https://api.commerce.coinbase.com";

export interface CoinbaseChargeResult {
  success: boolean;
  chargeId?: string;
  code?: string;
  hostedUrl?: string;
  error?: string;
}

export interface CoinbaseWebhookEvent {
  id: string;
  type: string;
  data: {
    id: string;
    code: string;
    metadata: {
      tier: string;
      sessionId: string;
      problemStatement: string;
    };
    pricing: {
      local: { amount: string; currency: string };
    };
    payments: Array<{
      value: { local: { amount: string; currency: string } };
      status: string;
    }>;
  };
}

/**
 * Create a Coinbase Commerce Charge for crypto payment
 */
export async function createCharge(
  tier: Tier,
  sessionId: string,
  problemStatement: string,
  walletAddress?: string
): Promise<CoinbaseChargeResult> {
  const apiKey = process.env.COINBASE_COMMERCE_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "Coinbase Commerce is not configured. Please set COINBASE_COMMERCE_API_KEY.",
    };
  }

  try {
    const priceUsd = getTierPrice(tier);
    const tierConfig = getTierConfig(tier);

    if (!tierConfig) {
      return { success: false, error: "Invalid tier" };
    }

    const baseUrl = process.env.VITE_APP_URL || process.env.ALLOWED_ORIGIN || "http://localhost:3000";

    const chargeData = {
      name: tierConfig.displayName,
      description: `${tierConfig.displayName} - AI Strategic UX Analysis`,
      local_price: {
        amount: priceUsd.toFixed(2),
        currency: "USD",
      },
      pricing_type: "fixed_price",
      metadata: {
        tier,
        sessionId,
        problemStatement: problemStatement.substring(0, 200),
        customerWallet: walletAddress || "",
      },
      redirect_url: `${baseUrl}/payment/success?session=${sessionId}`,
      cancel_url: `${baseUrl}/payment/cancel?session=${sessionId}`,
    };

    const response = await fetch(`${COINBASE_COMMERCE_API}/charges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CC-Api-Key": apiKey,
        "X-CC-Version": "2018-03-22",
      },
      body: JSON.stringify(chargeData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error((errorData as any).error?.message || `HTTP ${response.status}`);
    }

    const { data: charge } = await response.json() as { data: { id: string; code: string; hosted_url: string } };

    console.log("[Coinbase] Charge created:", charge.id, "Code:", charge.code);

    return {
      success: true,
      chargeId: charge.id,
      code: charge.code,
      hostedUrl: charge.hosted_url,
    };
  } catch (error: any) {
    console.error("[Coinbase] Failed to create charge:", error);
    return {
      success: false,
      error: error.message || "Failed to create crypto payment",
    };
  }
}

/**
 * Verify Coinbase webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const webhookSecret = process.env.COINBASE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Coinbase] Webhook secret not configured");
    return false;
  }

  try {
    const hash = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    return hash === signature;
  } catch (error: any) {
    console.error("[Coinbase] Webhook signature verification failed:", error);
    return false;
  }
}

/**
 * Get charge details from Coinbase
 */
export async function getCharge(chargeId: string): Promise<any | null> {
  const apiKey = process.env.COINBASE_COMMERCE_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(`${COINBASE_COMMERCE_API}/charges/${chargeId}`, {
      headers: {
        "X-CC-Api-Key": apiKey,
        "X-CC-Version": "2018-03-22",
      },
    });

    if (!response.ok) return null;

    const { data } = await response.json() as { data: any };
    return data;
  } catch (error) {
    console.error("[Coinbase] Failed to get charge:", error);
    return null;
  }
}

/**
 * Check if Coinbase Commerce is configured
 */
export function isCoinbaseConfigured(): boolean {
  return !!process.env.COINBASE_COMMERCE_API_KEY;
}
