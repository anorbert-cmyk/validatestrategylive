import { describe, it, expect } from "vitest";

describe("Stripe API Key Validation", () => {
  const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
  const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET;

  it.skipIf(!hasStripeKey)("should have STRIPE_SECRET_KEY configured", () => {
    const key = process.env.STRIPE_SECRET_KEY;
    expect(key).toBeDefined();
    expect(key).not.toBe("");
    expect(key?.startsWith("sk_")).toBe(true);
  });

  it.skipIf(!hasWebhookSecret)("should have STRIPE_WEBHOOK_SECRET configured", () => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    expect(secret).toBeDefined();
    expect(secret).not.toBe("");
    expect(secret?.startsWith("whsec_")).toBe(true);
  });
});
