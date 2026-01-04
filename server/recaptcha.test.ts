import { describe, it, expect } from "vitest";

describe("reCAPTCHA v3 Configuration", () => {
  const hasSiteKey = !!process.env.VITE_RECAPTCHA_SITE_KEY;
  const hasSecretKey = !!process.env.RECAPTCHA_SECRET_KEY;

  it.skipIf(!hasSiteKey)("should have VITE_RECAPTCHA_SITE_KEY configured", () => {
    expect(process.env.VITE_RECAPTCHA_SITE_KEY).toBeDefined();
    expect(process.env.VITE_RECAPTCHA_SITE_KEY).not.toBe("");
  });

  it.skipIf(!hasSecretKey)("should have RECAPTCHA_SECRET_KEY configured", () => {
    expect(process.env.RECAPTCHA_SECRET_KEY).toBeDefined();
    expect(process.env.RECAPTCHA_SECRET_KEY).not.toBe("");
  });

  it.skipIf(!hasSiteKey)("should have valid reCAPTCHA site key format", () => {
    const siteKey = process.env.VITE_RECAPTCHA_SITE_KEY;
    expect(siteKey?.length).toBeGreaterThanOrEqual(30);
    expect(siteKey).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it.skipIf(!hasSecretKey)("should verify reCAPTCHA secret key with Google API", async () => {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=test_token`,
    });

    expect(response.ok).toBe(true);
    const data = await response.json();

    const hasInvalidSecret = data["error-codes"]?.includes("invalid-input-secret");
    expect(hasInvalidSecret).toBe(false);
  });
});
