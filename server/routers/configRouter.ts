import { publicProcedure, router } from "../_core/trpc";
import { isNowPaymentsConfigured } from "../services/nowPaymentsService";
import { isPayPalConfigured } from "../services/paypalService";

export const configRouter = router({
    getPaymentConfig: publicProcedure.query(() => {
        return {
            // NOWPayments is the primary crypto payment method
            nowPaymentsEnabled: isNowPaymentsConfigured(),
            // LemonSqueezy disabled until company is established
            lemonSqueezyEnabled: false,
            // Coinbase replaced with NOWPayments
            coinbaseEnabled: false,
            paypalEnabled: isPayPalConfigured(),
            perplexityEnabled: !!process.env.PERPLEXITY_API_KEY,
        };
    }),
});
