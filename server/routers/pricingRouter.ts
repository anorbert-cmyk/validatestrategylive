/**
 * Pricing Router
 * Handles tier configuration and pricing endpoints
 */

import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getTierConfig, TIER_CONFIGS } from "../../shared/pricing";

// Zod schemas
const tierSchema = z.enum(["standard", "medium", "full"]);

export const pricingRouter = router({
    getTiers: publicProcedure.query(() => {
        return Object.values(TIER_CONFIGS);
    }),

    getTier: publicProcedure
        .input(z.object({ tier: tierSchema }))
        .query(({ input }) => {
            return getTierConfig(input.tier);
        }),
});
