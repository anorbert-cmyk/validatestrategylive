/**
 * Session Router
 * Handles analysis session creation and retrieval
 * 
 * SECURITY CONTROLS:
 * - protectedProcedure for user-specific data
 */

import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import {
    createAnalysisSession,
    getAnalysisSessionById,
    getAnalysisSessionsByUserId,
    getAnalysisResultsByUserId,
    getPurchasesByUserId,
} from "../db";

// Zod schemas
const tierSchema = z.enum(["standard", "medium", "full"]);

export const sessionRouter = router({
    create: publicProcedure
        .input(z.object({
            problemStatement: z.string().min(10).max(5000),
            tier: tierSchema,
            email: z.string().email().optional(),
            isPriority: z.boolean().optional(),
            prioritySource: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
            const sessionId = nanoid(16);

            await createAnalysisSession({
                sessionId,
                userId: ctx.user?.id,
                email: input.email || ctx.user?.email,
                problemStatement: input.problemStatement,
                tier: input.tier,
                status: "pending_payment",
                isPriority: input.isPriority || false,
                prioritySource: input.prioritySource,
            });

            return { sessionId, tier: input.tier };
        }),

    get: publicProcedure
        .input(z.object({ sessionId: z.string() }))
        .query(async ({ input }) => {
            const session = await getAnalysisSessionById(input.sessionId);
            if (!session) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
            }
            return session;
        }),

    // SECURITY: protectedProcedure ensures only authenticated users can access their own sessions
    getMyAnalyses: protectedProcedure.query(async ({ ctx }) => {
        const sessions = await getAnalysisSessionsByUserId(ctx.user.id);
        const results = await getAnalysisResultsByUserId(ctx.user.id);
        const purchases = await getPurchasesByUserId(ctx.user.id);

        return sessions.map(session => ({
            ...session,
            result: results.find(r => r.sessionId === session.sessionId),
            purchase: purchases.find(p => p.sessionId === session.sessionId),
        }));
    }),
});
