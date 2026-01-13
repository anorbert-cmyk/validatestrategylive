/**
 * Background Worker: Retry Queue Processor
 * Handles failed analysis steps and retries them with exponential backoff
 * Configured as a Background Worker service on Render
 */
import "dotenv/config";
import { startRetryQueueProcessor, stopRetryQueueProcessor } from "../server/services/retryQueueProcessor";

// Handle graceful shutdown
process.on("SIGTERM", async () => {
    console.log("[Worker] SIGTERM received. Shutting down retry queue processor...");
    stopRetryQueueProcessor();
    process.exit(0);
});

process.on("SIGINT", async () => {
    console.log("[Worker] SIGINT received. Shutting down retry queue processor...");
    stopRetryQueueProcessor();
    process.exit(0);
});

console.log("[Worker] Starting retry queue processor...");
startRetryQueueProcessor();
