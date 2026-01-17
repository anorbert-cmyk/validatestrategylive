/**
 * SIWE (Sign-In With Ethereum) Authentication Service
 * Handles wallet-based authentication for crypto payment users
 * 
 * Flow:
 * 1. User pays with crypto via NOWPayments
 * 2. Webhook saves pay_address to purchases table
 * 3. User connects wallet → requests nonce
 * 4. User signs message with wallet
 * 5. Verify signature + check if wallet has purchase → create JWT
 */

import crypto from 'crypto';
import { eq, and, gt } from 'drizzle-orm';
import { getDb } from '../db';
import { siweNonces, purchases } from '../../drizzle/schema';
import { ethers } from 'ethers';
import { createSessionJWT } from './magicLink';

const NONCE_EXPIRY_MINUTES = 15;

/**
 * Generate a secure nonce for SIWE
 */
function generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
}

/**
 * Create a nonce for wallet signature verification
 */
export async function createSiweNonce(walletAddress?: string): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const nonce = generateNonce();
    const expiresAt = new Date(Date.now() + NONCE_EXPIRY_MINUTES * 60 * 1000);

    await db.insert(siweNonces).values({
        nonce,
        walletAddress: walletAddress?.toLowerCase() || null,
        expiresAt,
    });

    const redactedAddress = walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 'unknown wallet';
    console.log(`[SIWE] Created nonce for ${redactedAddress}`);
    return nonce;
}

/**
 * Build the SIWE message to be signed
 */
export function buildSiweMessage(params: {
    address: string;
    nonce: string;
    domain?: string;
    statement?: string;
}): string {
    const domain = params.domain || 'validatestrategy.com';
    const statement = params.statement || 'Sign in to ValidateStrategy to access your analysis.';
    const issuedAt = new Date().toISOString();

    // Standard SIWE message format (EIP-4361)
    return `${domain} wants you to sign in with your Ethereum account:
${params.address}

${statement}

URI: https://${domain}
Version: 1
Chain ID: 1
Nonce: ${params.nonce}
Issued At: ${issuedAt}`;
}

/**
 * Verify a wallet signature and check for purchase
 */
export async function verifySiweSignature(params: {
    address: string;
    signature: string;
    message: string;
    nonce: string;
}): Promise<{
    valid: boolean;
    hasPurchase: boolean;
    email?: string;
    sessionId?: string;
    error?: string;
}> {
    const db = await getDb();
    if (!db) return { valid: false, hasPurchase: false, error: 'Database not available' };

    const address = params.address.toLowerCase();

    // 1. Verify nonce exists and is not used
    const [nonceRecord] = await db
        .select()
        .from(siweNonces)
        .where(
            and(
                eq(siweNonces.nonce, params.nonce),
                eq(siweNonces.isUsed, false),
                gt(siweNonces.expiresAt, new Date())
            )
        )
        .limit(1);

    if (!nonceRecord) {
        console.log(`[SIWE] Nonce not found or expired: ${params.nonce}`);
        return { valid: false, hasPurchase: false, error: 'Invalid or expired nonce' };
    }

    // 2. Verify signature
    try {
        const recoveredAddress = ethers.verifyMessage(params.message, params.signature);

        if (recoveredAddress.toLowerCase() !== address) {
            console.log(`[SIWE] Address mismatch: expected ${address}, got ${recoveredAddress.toLowerCase()}`);
            return { valid: false, hasPurchase: false, error: 'Invalid signature' };
        }
    } catch (error) {
        console.log(`[SIWE] Signature verification failed:`, error);
        return { valid: false, hasPurchase: false, error: 'Invalid signature format' };
    }

    // 3. Mark nonce as used
    await db
        .update(siweNonces)
        .set({ isUsed: true, usedAt: new Date(), walletAddress: address })
        .where(eq(siweNonces.id, nonceRecord.id));

    // 4. Check if wallet has any completed purchase
    const [purchase] = await db
        .select()
        .from(purchases)
        .where(
            and(
                eq(purchases.walletAddress, address),
                eq(purchases.paymentStatus, 'completed')
            )
        )
        .limit(1);

    const redactedAddress = address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'unknown wallet';

    if (!purchase) {
        console.log(`[SIWE] Wallet ${redactedAddress} has no completed purchases`);
        return {
            valid: true,
            hasPurchase: false,
            error: 'No purchase found for this wallet',
        };
    }

    console.log(`[SIWE] Wallet ${redactedAddress} verified with purchase ${purchase.sessionId}`);

    return {
        valid: true,
        hasPurchase: true,
        sessionId: purchase.sessionId,
    };
}

/**
 * Complete SIWE authentication and create session
 */
export async function authenticateWithWallet(params: {
    address: string;
    signature: string;
    message: string;
    nonce: string;
}): Promise<{
    success: boolean;
    jwt?: string;
    sessionId?: string;
    error?: string;
}> {
    const result = await verifySiweSignature(params);

    if (!result.valid) {
        return { success: false, error: result.error };
    }

    if (!result.hasPurchase) {
        return { success: false, error: 'No purchase found for this wallet' };
    }

    // Create JWT session
    const jwt = await createSessionJWT({
        email: `wallet:${params.address.toLowerCase()}`, // Use wallet as identifier
        sessionId: result.sessionId,
        loginMethod: 'siwe',
    });

    return {
        success: true,
        jwt,
        sessionId: result.sessionId,
    };
}

/**
 * Check if a wallet address has any completed purchases
 */
export async function walletHasPurchase(address: string): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    const [purchase] = await db
        .select()
        .from(purchases)
        .where(
            and(
                eq(purchases.walletAddress, address.toLowerCase()),
                eq(purchases.paymentStatus, 'completed')
            )
        )
        .limit(1);

    return !!purchase;
}

/**
 * Get all sessions/analyses for a wallet
 */
export async function getWalletSessions(address: string): Promise<string[]> {
    const db = await getDb();
    if (!db) return [];

    const walletPurchases = await db
        .select({ sessionId: purchases.sessionId })
        .from(purchases)
        .where(
            and(
                eq(purchases.walletAddress, address.toLowerCase()),
                eq(purchases.paymentStatus, 'completed')
            )
        );

    return walletPurchases.map((p: { sessionId: string }) => p.sessionId);
}
