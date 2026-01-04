import { describe, it, expect } from "vitest";
import { isNowPaymentsConfigured } from "./services/nowPaymentsService";

describe("NOWPayments Integration", () => {
  const hasApiKey = !!process.env.NOWPAYMENTS_API_KEY;
  const hasIpnSecret = !!process.env.NOWPAYMENTS_IPN_SECRET;

  it.skipIf(!hasApiKey)("should have NOWPayments API key configured", () => {
    expect(process.env.NOWPAYMENTS_API_KEY).toBeDefined();
    expect(process.env.NOWPAYMENTS_API_KEY).not.toBe("");
  });

  it.skipIf(!hasIpnSecret)("should have NOWPayments IPN secret configured", () => {
    expect(process.env.NOWPAYMENTS_IPN_SECRET).toBeDefined();
    expect(process.env.NOWPAYMENTS_IPN_SECRET).not.toBe("");
  });

  it.skipIf(!hasApiKey || !hasIpnSecret)("should report NOWPayments as configured", () => {
    const isConfigured = isNowPaymentsConfigured();
    expect(isConfigured).toBe(true);
  });

  it.skipIf(!hasApiKey)("should validate API key format", () => {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    expect(apiKey).toMatch(/^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/);
  });
});
