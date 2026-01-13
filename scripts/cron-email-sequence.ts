/**
 * Cron Job: Email Sequence Processor
 * Runs hourly to send nurturing emails based on user progress and triggers
 * Configured as a Cron Job service on Render
 */
import "dotenv/config";
import { runEmailSequenceCron } from "../server/emailCron";

async function runCallback() {
    console.log("[Cron] Starting email sequence processing...");
    try {
        const result = await runEmailSequenceCron();
        console.log(`[Cron] Completed: ${result.sent} sent, ${result.errors} errors`);
        process.exit(0);
    } catch (error) {
        console.error("[Cron] Failed:", error);
        process.exit(1);
    }
}

runCallback();
