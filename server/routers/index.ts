/**
 * App Router Aggregator
 * Combines all domain-specific routers into the main appRouter
 */

import { router } from "../_core/trpc";
import { systemRouter } from "../_core/systemRouter";
import { authRouter } from "./authRouter";
import { pricingRouter } from "./pricingRouter";
import { sessionRouter } from "./sessionRouter";
import { paymentRouter } from "./paymentRouter";
import { analysisRouter } from "./analysisRouter";
import { emailSubscriberRouter } from "./emailSubscriberRouter";
import { demoRouter } from "./demoRouter";
import { adminRouter } from "./adminRouter";
import { adminLogRouter } from "./adminLogRouter";
import { configRouter } from "./configRouter";

export const appRouter = router({
    system: systemRouter,
    auth: authRouter,
    pricing: pricingRouter,
    session: sessionRouter,
    payment: paymentRouter,
    analysis: analysisRouter,
    emailSubscriber: emailSubscriberRouter,
    demo: demoRouter,
    admin: adminRouter,
    adminLogs: adminLogRouter,
    config: configRouter,
});

export type AppRouter = typeof appRouter;
