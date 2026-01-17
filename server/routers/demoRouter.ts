/**
 * Demo Router
 * Handles demo analysis endpoint
 */

import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDemoAnalysisResult, getAnalysisSessionById } from "../db";

export const demoRouter = router({
    getAnalysis: publicProcedure.query(async () => {
        const result = await getDemoAnalysisResult();
        if (!result) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Demo analysis not found" });
        }
        // Also get the session info for problem statement
        const session = await getAnalysisSessionById(result.sessionId);
        return {
            ...result,
            problemStatement: session?.problemStatement || "Demo analysis",
            tier: session?.tier || result.tier,
            status: session?.status || "completed",
        };
    }),
});
