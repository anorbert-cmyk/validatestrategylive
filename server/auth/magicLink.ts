/**
 * Magic Link Authentication Service
 * Handles passwordless email authentication via magic links
 * 
 * Flow:
 * 1. After Stripe payment success, generate magic link token
 * 2. Send email with magic link via Resend
 * 3. User clicks link → verify token → create JWT session
 */

import crypto from 'crypto';
import { eq, and, gt } from 'drizzle-orm';
import { getDb } from '../db';
import { magicLinkTokens } from '../../drizzle/schema';
import * as jose from 'jose';
import { ENV } from '../_core/env';

const MAGIC_LINK_EXPIRY_HOURS = 72; // 3 days
const JWT_EXPIRY_DAYS = 30;

/**
 * Generate a secure random token
 */
function generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a magic link token and store in database
 */
export async function createMagicLinkToken(params: {
    email: string;
    sessionId?: string;
    purchaseId?: number;
}): Promise<string> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_HOURS * 60 * 60 * 1000);

    await db.insert(magicLinkTokens).values({
        token,
        email: params.email.toLowerCase(),
        sessionId: params.sessionId || null,
        purchaseId: params.purchaseId || null,
        expiresAt,
    });

    // Redact email for logging
    const redactedEmail = params.email.replace(/(^.).*(@.*$)/, '$1***$2');
    console.log(`[MagicLink] Created token for ${redactedEmail}, expires: ${expiresAt.toISOString()}`);
    return token;
}

/**
 * Build the full magic link URL
 */
export function buildMagicLinkUrl(token: string): string {
    const baseUrl = ENV.appUrl || 'https://validatestrategy.com';
    return `${baseUrl}/auth/verify?token=${token}`;
}

/**
 * Verify a magic link token and return session info
 */
export async function verifyMagicLinkToken(token: string): Promise<{
    valid: boolean;
    email?: string;
    sessionId?: string | null;
    purchaseId?: number | null;
    error?: string;
}> {
    const db = await getDb();
    if (!db) return { valid: false, error: 'Database not available' };

    // Find token in database
    const [tokenRecord] = await db
        .select()
        .from(magicLinkTokens)
        .where(
            and(
                eq(magicLinkTokens.token, token),
                eq(magicLinkTokens.isUsed, false),
                gt(magicLinkTokens.expiresAt, new Date())
            )
        )
        .limit(1);

    if (!tokenRecord) {
        console.log(`[MagicLink] Token not found or expired: ${token.substring(0, 8)}...`);
        return { valid: false, error: 'Invalid or expired token' };
    }

    // Mark token as used
    await db
        .update(magicLinkTokens)
        .set({ isUsed: true, usedAt: new Date() })
        .where(eq(magicLinkTokens.id, tokenRecord.id));

    // Redact email for logging
    const redactedEmail = tokenRecord.email.replace(/(^.).*(@.*$)/, '$1***$2');
    console.log(`[MagicLink] Token verified for ${redactedEmail}`);

    return {
        valid: true,
        email: tokenRecord.email,
        sessionId: tokenRecord.sessionId,
        purchaseId: tokenRecord.purchaseId,
    };
}

/**
 * Create a JWT session token for authenticated user
 */
export async function createSessionJWT(params: {
    email: string;
    sessionId?: string | null;
    loginMethod: 'magic_link' | 'siwe';
}): Promise<string> {
    if (!ENV.jwtSecret) {
        throw new Error('JWT_SECRET is not configured');
    }

    const secret = new TextEncoder().encode(ENV.jwtSecret);

    const jwt = await new jose.SignJWT({
        email: params.email,
        sessionId: params.sessionId || null,
        loginMethod: params.loginMethod,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${JWT_EXPIRY_DAYS}d`)
        .setSubject(params.email)
        .sign(secret);

    // Redact email for logging (e***@domain.com)
    const redactedEmail = params.email.replace(/(^.).*(@.*$)/, '$1***$2');
    console.log(`[MagicLink] Created JWT session for ${redactedEmail}`);
    return jwt;
}

/**
 * Verify a JWT session token
 */
export async function verifySessionJWT(token: string): Promise<{
    valid: boolean;
    payload?: {
        email: string;
        sessionId: string | null;
        loginMethod: 'magic_link' | 'siwe';
    };
    error?: string;
}> {
    try {
        if (!ENV.jwtSecret) {
            throw new Error('JWT_SECRET is not configured');
        }

        const secret = new TextEncoder().encode(ENV.jwtSecret);

        const { payload } = await jose.jwtVerify(token, secret);

        return {
            valid: true,
            payload: {
                email: payload.email as string,
                sessionId: payload.sessionId as string | null,
                loginMethod: payload.loginMethod as 'magic_link' | 'siwe',
            },
        };
    } catch (error) {
        console.log(`[MagicLink] JWT verification failed:`, error);
        return { valid: false, error: 'Invalid or expired session' };
    }
}

/**
 * Clean up expired magic link tokens (call periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    // Delete used tokens older than 7 days
    await db
        .delete(magicLinkTokens)
        .where(eq(magicLinkTokens.isUsed, true));

    console.log('[MagicLink] Cleaned up expired tokens');
    return 0;
}
