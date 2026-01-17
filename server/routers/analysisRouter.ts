/**
 * Analysis Router
 * Handles analysis results endpoints
 */

import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getAnalysisResultBySessionId, getAnalysisResultsByUserId } from "../db";

export const analysisRouter = router({
    getResult: publicProcedure
        .input(z.object({ sessionId: z.string() }))
        .query(async ({ input }) => {
            const result = await getAnalysisResultBySessionId(input.sessionId);
            if (!result) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Analysis result not found" });
            }
            return result;
        }),

    // SECURITY: protectedProcedure ensures only authenticated users can access their own results
    getMyResults: protectedProcedure.query(async ({ ctx }) => {
        return await getAnalysisResultsByUserId(ctx.user.id);
    }),
});
