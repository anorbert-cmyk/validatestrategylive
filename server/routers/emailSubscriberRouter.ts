/**
 * Email Subscriber Router
 * Handles email subscription with double opt-in verification
 * 
 * SECURITY CONTROLS:
 * - reCAPTCHA soft verification
 * - Disposable email detection
 * - protectedProcedure for admin endpoints
 */

import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { saveEmailSubscriber, getAllEmailSubscribers, getEmailSubscriberCount } from "../db";

export const emailSubscriberRouter = router({
    // Subscribe with double opt-in verification
    subscribe: publicProcedure
        .input(z.object({
            email: z.string().email(),
            source: z.string().optional().default("demo_gate"),
            recaptchaToken: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            // Verify reCAPTCHA if token provided (soft verification - never blocks users)
            if (input.recaptchaToken) {
                try {
                    const { verifyRecaptcha } = await import("../services/recaptchaService");
                    const recaptchaResult = await verifyRecaptcha(input.recaptchaToken, "email_subscribe", 0.3);
                    if (recaptchaResult.success) {
                        console.log(`[EmailSubscriber] reCAPTCHA passed for ${input.email}: score=${recaptchaResult.score}`);
                    } else {
                        // Log but don't block - honeypot and disposable email checks are primary protection
                        console.warn(`[EmailSubscriber] reCAPTCHA soft-fail for ${input.email}: ${recaptchaResult.error}`);
                    }
                } catch (recaptchaError) {
                    // Never block on reCAPTCHA errors - it's supplementary protection
                    console.warn(`[EmailSubscriber] reCAPTCHA error for ${input.email}:`, recaptchaError);
                }
            }

            // Import validation service
            const { validateEmail, generateVerificationToken } = await import("../services/emailValidationService");
            const { sendVerificationEmail } = await import("../services/emailService");

            // Validate email (format + disposable check)
            const validation = validateEmail(input.email);
            if (!validation.isValid) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: validation.error || "Invalid email address"
                });
            }

            // Generate verification token
            const verificationToken = generateVerificationToken();

            // Save subscriber with verification token
            const result = await saveEmailSubscriber(input.email, input.source, verificationToken);

            // If email already exists and is verified, return success
            if (!result.isNew && result.isVerified) {
                return { success: true, isNew: false, needsVerification: false, isVerified: true };
            }

            // If email already exists but not verified, resend verification
            if (!result.isNew && !result.isVerified) {
                // Update verification token
                const { getEmailSubscriberByEmail } = await import("../db");
                const subscriber = await getEmailSubscriberByEmail(input.email);
                if (subscriber) {
                    const { getDb } = await import("../db");
                    const { emailSubscribers } = await import("../../drizzle/schema");
                    const { eq } = await import("drizzle-orm");
                    const db = await getDb();
                    if (db) {
                        await db.update(emailSubscribers)
                            .set({
                                verificationToken,
                                verificationSentAt: new Date()
                            })
                            .where(eq(emailSubscribers.id, subscriber.id));
                    }
                }
            }

            // Send verification email
            const appUrl = process.env.VITE_APP_URL || 'https://validatestrategy.com';
            const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;

            try {
                await sendVerificationEmail({
                    to: input.email,
                    verificationUrl,
                });
                console.log(`[EmailSubscriber] Verification email sent to ${input.email}`);
            } catch (error) {
                console.error(`[EmailSubscriber] Failed to send verification email to ${input.email}:`, error);
            }

            return {
                success: true,
                isNew: result.isNew,
                needsVerification: true,
                isVerified: false,
                subscriberId: result.subscriberId
            };
        }),

    // Verify email with token
    verify: publicProcedure
        .input(z.object({
            token: z.string(),
        }))
        .mutation(async ({ input }) => {
            const { verifyEmailSubscriber } = await import("../db");
            const result = await verifyEmailSubscriber(input.token);

            if (!result.success) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Invalid or expired verification link"
                });
            }

            // Send welcome email after verification
            if (result.email) {
                try {
                    const { sendWelcomeEmail } = await import("../emailNurturing");
                    const { getEmailSubscriberByEmail } = await import("../db");
                    const subscriber = await getEmailSubscriberByEmail(result.email);
                    if (subscriber) {
                        await sendWelcomeEmail(subscriber.id, result.email);
                        console.log(`[EmailSubscriber] Welcome email sent to ${result.email}`);
                    }
                } catch (error) {
                    console.error(`[EmailSubscriber] Failed to send welcome email:`, error);
                }
            }

            return { success: true, email: result.email };
        }),

    // Check if email is verified
    checkVerification: publicProcedure
        .input(z.object({
            email: z.string().email(),
        }))
        .query(async ({ input }) => {
            const { getEmailSubscriberByEmail } = await import("../db");
            const subscriber = await getEmailSubscriberByEmail(input.email);
            return {
                exists: !!subscriber,
                isVerified: subscriber?.isVerified || false
            };
        }),

    // SECURITY: protectedProcedure - Admin only - get all subscribers
    getAll: protectedProcedure.query(async () => {
        return await getAllEmailSubscribers();
    }),

    // SECURITY: protectedProcedure - Admin only - get subscriber count
    getCount: protectedProcedure.query(async () => {
        return await getEmailSubscriberCount();
    }),

    // SECURITY: protectedProcedure - Process email sequence (can be called via cron or manually)
    processSequence: protectedProcedure.mutation(async () => {
        const { runEmailSequenceCron } = await import("../emailCron");
        return await runEmailSequenceCron();
    }),
});
