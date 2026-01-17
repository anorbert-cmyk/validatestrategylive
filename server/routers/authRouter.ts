/**
 * Auth Router
 * Handles SIWE (Wallet) and Magic Link authentication
 * 
 * SECURITY CONTROLS:
 * - Cookie-based session management
 * - SIWE signature verification
 * - Magic link token verification
 */

import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getAnalysisResultBySessionId, getAnalysisSessionById } from "../db";

export const authRouter = router({
    me: publicProcedure.query(opts => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
        return { success: true } as const;
    }),

    // ============ SIWE (Wallet) Authentication ============
    // Get nonce for wallet signature
    getSiweNonce: publicProcedure
        .input(z.object({ walletAddress: z.string().optional() }))
        .mutation(async ({ input }) => {
            const { createSiweNonce, buildSiweMessage } = await import("../auth/siwe");
            const nonce = await createSiweNonce(input.walletAddress);
            const message = input.walletAddress
                ? buildSiweMessage({ address: input.walletAddress, nonce })
                : null;
            return { nonce, message };
        }),

    // Verify wallet signature and check for purchases
    verifySiwe: publicProcedure
        .input(z.object({
            address: z.string(),
            signature: z.string(),
            message: z.string(),
            nonce: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
            const { authenticateWithWallet } = await import("../auth/siwe");
            const result = await authenticateWithWallet(input);

            if (!result.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: result.error });
            }

            // Set session cookie
            if (result.jwt) {
                const cookieOptions = getSessionCookieOptions(ctx.req);
                ctx.res.cookie(COOKIE_NAME, result.jwt, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
            }

            return { success: true, sessionId: result.sessionId };
        }),

    // Get all analyses for connected wallet
    getWalletAnalyses: publicProcedure
        .input(z.object({ walletAddress: z.string() }))
        .query(async ({ input }) => {
            const { getPurchasesByWalletAddress } = await import("../db");
            const purchases = await getPurchasesByWalletAddress(input.walletAddress);

            // Get analysis results for each purchase
            const analyses = await Promise.all(
                purchases.map(async (p) => {
                    const result = await getAnalysisResultBySessionId(p.sessionId);
                    const session = await getAnalysisSessionById(p.sessionId);
                    return {
                        sessionId: p.sessionId,
                        tier: p.tier,
                        createdAt: p.createdAt,
                        status: session?.status || "unknown",
                        hasResult: !!result,
                    };
                })
            );

            return analyses;
        }),

    // ============ Magic Link Authentication ============
    // Request magic link email
    requestMagicLink: publicProcedure
        .input(z.object({ email: z.string().email() }))
        .mutation(async ({ input }) => {
            const { createMagicLinkToken } = await import("../auth/magicLink");
            const { sendMagicLinkEmail } = await import("../services/emailService");

            // Generate token
            const token = await createMagicLinkToken({ email: input.email });

            // Send email
            const appUrl = process.env.VITE_APP_URL || 'http://localhost:3000'; // Fallback for local
            const magicLinkUrl = `${appUrl}/login/magic?token=${token}`;

            await sendMagicLinkEmail(input.email, magicLinkUrl);

            return { success: true };
        }),

    // Verify magic link token
    verifyMagicLink: publicProcedure
        .input(z.object({ token: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const { verifyMagicLinkToken, createSessionJWT } = await import("../auth/magicLink");
            const result = await verifyMagicLinkToken(input.token);

            if (!result.valid) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: result.error });
            }

            // Create JWT and set cookie
            const jwt = await createSessionJWT({
                email: result.email!,
                sessionId: result.sessionId,
                loginMethod: "magic_link",
            });

            const cookieOptions = getSessionCookieOptions(ctx.req);
            ctx.res.cookie(COOKIE_NAME, jwt, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

            return {
                success: true,
                email: result.email,
                sessionId: result.sessionId,
            };
        }),
});
