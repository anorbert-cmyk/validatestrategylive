/**
 * Wallet Authentication Service
 * Handles MetaMask signature verification for admin access
 */

import { verifyMessage } from "ethers";
import { isAdminWallet, isSignatureUsed, markSignatureUsed } from "../db";

const AUTH_MESSAGE_PREFIX = "Authenticate to Rapid Apollo Admin: ";
const SIGNATURE_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes

export interface WalletAuthResult {
  success: boolean;
  isAdmin: boolean;
  error?: string;
}

/**
 * Generate the message to be signed by the wallet
 */
export function generateAuthMessage(timestamp: number): string {
  return `${AUTH_MESSAGE_PREFIX}${timestamp}`;
}

/**
 * Verify admin wallet signature
 * Includes replay attack prevention
 */
export async function verifyAdminSignature(
  signature: string,
  timestamp: number,
  claimedAddress: string
): Promise<WalletAuthResult> {
  try {
    // Check timestamp validity (5 minutes)
    const now = Date.now();
    if (Math.abs(now - timestamp) > SIGNATURE_VALIDITY_MS) {
      return {
        success: false,
        isAdmin: false,
        error: "Authentication token expired. Please sign again.",
      };
    }

    // Verify the signature
    const message = generateAuthMessage(timestamp);
    let recoveredAddress: string;
    
    try {
      recoveredAddress = verifyMessage(message, signature);
    } catch (e) {
      return {
        success: false,
        isAdmin: false,
        error: "Invalid signature format",
      };
    }

    // Check if recovered address matches claimed address
    if (recoveredAddress.toLowerCase() !== claimedAddress.toLowerCase()) {
      return {
        success: false,
        isAdmin: false,
        error: "Signature does not match the provided address",
      };
    }

    // Check if the address is an admin wallet
    const isAdmin = await isAdminWallet(recoveredAddress);
    if (!isAdmin) {
      // Also check environment variable for primary admin
      const envAdminWallet = process.env.ADMIN_WALLET_ADDRESS;
      if (!envAdminWallet || recoveredAddress.toLowerCase() !== envAdminWallet.toLowerCase()) {
        return {
          success: false,
          isAdmin: false,
          error: "Unauthorized: Not an admin wallet",
        };
      }
    }

    // Check for replay attack
    const alreadyUsed = await isSignatureUsed(signature);
    if (alreadyUsed) {
      return {
        success: false,
        isAdmin: false,
        error: "Signature already used. Please sign again.",
      };
    }

    // Mark signature as used
    await markSignatureUsed(signature, recoveredAddress);

    return {
      success: true,
      isAdmin: true,
    };
  } catch (error: any) {
    console.error("[WalletAuth] Verification failed:", error);
    return {
      success: false,
      isAdmin: false,
      error: error.message || "Authentication failed",
    };
  }
}

/**
 * Check if an address is an admin (without signature verification)
 * Used for initial status check
 */
export async function checkAdminStatus(address: string): Promise<boolean> {
  if (!address) return false;
  
  // Check database
  const isDbAdmin = await isAdminWallet(address);
  if (isDbAdmin) return true;
  
  // Check environment variable
  const envAdminWallet = process.env.ADMIN_WALLET_ADDRESS;
  if (envAdminWallet && address.toLowerCase() === envAdminWallet.toLowerCase()) {
    return true;
  }
  
  return false;
}
