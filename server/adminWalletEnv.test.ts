import { describe, it, expect } from "vitest";

describe("Admin Wallet Address Environment Variable", () => {
  const hasAdminWallet = !!process.env.VITE_ADMIN_WALLET_ADDRESS;

  it.skipIf(!hasAdminWallet)("should have VITE_ADMIN_WALLET_ADDRESS configured", () => {
    const adminWallet = process.env.VITE_ADMIN_WALLET_ADDRESS;
    expect(adminWallet).toBeDefined();
    expect(adminWallet).not.toBe("");
  });

  it.skipIf(!hasAdminWallet)("should be a valid Ethereum address format", () => {
    const adminWallet = process.env.VITE_ADMIN_WALLET_ADDRESS;
    expect(adminWallet).toBeDefined();
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    expect(adminWallet).toMatch(ethAddressRegex);
  });
});
