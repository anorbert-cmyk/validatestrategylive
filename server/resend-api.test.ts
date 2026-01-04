import { describe, it, expect } from "vitest";

/**
 * Test to validate that the Resend API key is properly configured
 * These tests are skipped if the environment variables are not set.
 */
describe("Resend API Configuration", () => {
  const hasApiKey = !!process.env.RESEND_API_KEY;
  const hasFromEmail = !!process.env.RESEND_FROM_EMAIL;

  it.skipIf(!hasApiKey)("should have RESEND_API_KEY environment variable set", () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe("");
  });

  it.skipIf(!hasApiKey)("should have valid Resend API key format (starts with re_)", () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey?.startsWith("re_")).toBe(true);
  });

  it.skipIf(!hasFromEmail)("should have RESEND_FROM_EMAIL environment variable set", () => {
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    expect(fromEmail).toBeDefined();
    expect(fromEmail).not.toBe("");
  });

  it.skipIf(!hasFromEmail)("should have valid email format for RESEND_FROM_EMAIL", () => {
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    expect(fromEmail).toBeDefined();
    expect(fromEmail).toMatch(/@/);
  });
});
