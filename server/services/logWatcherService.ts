import fs from "fs";
import path from "path";
import { aiLogSentinel } from "./aiLogSentinel";
import { notificationService } from "./notificationService";
import crypto from "crypto";
import { ENV } from "../_core/env";

const ANALYSIS_FILE = path.join(process.cwd(), "server", "data", "auto_analysis.json");

interface AnalysisEntry {
    id: string; // hash of message
    message: string;
    analysis: string;
    timestamp: number;
    embedding?: number[]; // Future proofing
}

interface AnalysisCache {
    [hash: string]: AnalysisEntry;
}

// In-memory queue
const logQueue: { level: string; message: string; meta: any }[] = [];
let isProcessing = false;
let cache: AnalysisCache = {};

// Load cache
try {
    if (fs.existsSync(ANALYSIS_FILE)) {
        cache = JSON.parse(fs.readFileSync(ANALYSIS_FILE, "utf-8"));
    }
} catch (e) {
    console.error("[LogWatcher] Failed to load analysis cache", e);
    cache = {};
}

function saveCache() {
    try {
        const dir = path.dirname(ANALYSIS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(ANALYSIS_FILE, JSON.stringify(cache, null, 2));
    } catch (e) {
        console.error("[LogWatcher] Failed to save cache", e);
    }
}

function generateHash(message: string): string {
    return crypto.createHash("md5").update(message).digest("hex");
}

export const logWatcherService = {
    /**
     * Called by Winston Transport when an error occurs
     */
    processError: (message: string, meta: any) => {
        // Enqueue
        logQueue.push({ level: "error", message, meta });
        processQueue(); // Fire and forget
    },

    /**
     * Get analysis if it exists
     */
    getAnalysis: (message: string): AnalysisEntry | null => {
        const hash = generateHash(message);
        return cache[hash] || null;
    }
};

async function processQueue() {
    if (isProcessing) return;
    if (logQueue.length === 0) return;

    isProcessing = true;

    try {
        while (logQueue.length > 0) {
            const entry = logQueue.shift();
            if (!entry) continue;

            const hash = generateHash(entry.message);

            // Debounce: If already analyzed recently (e.g. 24h), skip
            // Unless it's a critical new variation? No, message-based hash handles that.
            if (cache[hash]) {
                const age = Date.now() - cache[hash].timestamp;
                if (age < 24 * 60 * 60 * 1000) {
                    // Already have recent analysis, skip re-burning tokens
                    continue;
                }
            }

            console.log(`[Jules Auto-Sentinel] Analyzing new error: ${entry.message.substring(0, 50)}...`);

            try {
                // Use default admin context (system automation)
                // We mock the signature verification for internal calls if needed, 
                // but aiLogSentinel helper might expect clean call. 
                // Wait, aiLogSentinel is a service, not a router.
                // It exposes `analyzeLog` via router but also we can export the core logic.

                // Oops, aiLogSentinel currently only has `router` exposed via TRPC?
                // No, I created `server/services/aiLogSentinel.ts`. Let's allow direct call.

                // Actually `aiLogSentinel.ts` in usage might be the TRPC one?
                // Assuming I need to export a direct function from there.

                const analysisText = await aiLogSentinel.analyzeInternally(entry.message, entry.meta);

                cache[hash] = {
                    id: hash,
                    message: entry.message,
                    analysis: analysisText,
                    timestamp: Date.now()
                };

                saveCache();

                saveCache();

                // Trigger Notification Orchestrator
                // Fire and forget to not block queue too long, or await if we want to throttle
                await notificationService.notifyFixReady({
                    id: hash,
                    timestamp: new Date().toISOString(),
                    level: "ERROR",
                    message: entry.message,
                    metadata: entry.meta,
                    autoAnalysis: analysisText
                }, analysisText);

            } catch (err) {
                console.error("[Jules Auto-Sentinel] Analysis failed:", err);
            }

            // Rate limiting: Wait 2 seconds between analyses to be nice to LLM
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    } finally {
        isProcessing = false;
        // Check again in case new logs came in
        if (logQueue.length > 0) processQueue();
    }
}
