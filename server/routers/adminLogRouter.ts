import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { TRPCError } from "@trpc/server";
import { verifyAdminSignature } from "../services/walletAuthService";
import { analyzeLogEntry } from "../services/aiLogSentinel";
import { logWatcherService } from "../services/logWatcherService";

// Path is relative to CWD (project root in dev/prod)
const LOG_FILE_PATH = path.join(process.cwd(), "logs", "combined.log");

export interface LogEntry {
    id: string;
    timestamp: string;
    level: "INFO" | "WARN" | "ERROR" | "DEBUG";
    message: string;
    metadata?: any;
    autoAnalysis?: string | null;
}

export const adminLogRouter = router({
    getLogs: publicProcedure
        .input(
            z.object({
                signature: z.string(),
                timestamp: z.number(),
                address: z.string(),
                limit: z.number().min(1).max(2000).default(500),
                level: z.enum(["INFO", "WARN", "ERROR"]).optional(),
                search: z.string().optional(),
            })
        )
        .query(async ({ input }) => {
            // 1. Verify Auth
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            // 2. Read Logs
            try {
                if (!fs.existsSync(LOG_FILE_PATH)) {
                    return { logs: [], total: 0 };
                }

                const fileContent = fs.readFileSync(LOG_FILE_PATH, "utf-8");
                const lines = fileContent.split("\n").filter((line) => line.trim());

                // Parse logs
                const parsedLogs: LogEntry[] = [];
                let currentEntry: LogEntry | null = null;

                // Regex to match start of log line: "YYYY-MM-DD HH:mm:ss [LEVEL]: "
                const logStartRegex = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\]: (.*)$/;

                for (const line of lines) {
                    const match = line.match(logStartRegex);

                    if (match) {
                        if (currentEntry) {
                            parsedLogs.push(currentEntry);
                        }

                        const timestamp = match[1];
                        const level = match[2].toUpperCase() as any;
                        const message = match[3];

                        currentEntry = {
                            id: `${timestamp}-${parsedLogs.length}`,
                            timestamp,
                            level,
                            message,
                        };
                    } else if (currentEntry) {
                        if (line.trim().startsWith("{") || line.trim().startsWith("at ") || line.trim().startsWith("Error:")) {
                            if (!currentEntry.metadata) currentEntry.metadata = "";
                            currentEntry.metadata += line + "\n";
                        } else {
                            currentEntry.message += "\n" + line;
                        }
                    }
                }

                if (currentEntry) {
                    parsedLogs.push(currentEntry);
                }

                // Post-process matches for Auto-Analysis
                parsedLogs.forEach(entry => {
                    if (entry.level === 'ERROR') {
                        // Reconstruct full context to match what Transport sees
                        const fullContext = entry.metadata
                            ? `${entry.message}\n${entry.metadata}`
                            : entry.message;

                        // Try both precise match and just message match
                        const analysis = logWatcherService.getAnalysis(fullContext)
                            || logWatcherService.getAnalysis(entry.message);

                        if (analysis) {
                            entry.autoAnalysis = analysis.analysis;
                        }
                    }
                });

                // Apply filters
                let filteredLogs = parsedLogs.reverse();

                if (input.level) {
                    filteredLogs = filteredLogs.filter(l => l.level === input.level);
                }

                if (input.search) {
                    const searchLower = input.search.toLowerCase();
                    filteredLogs = filteredLogs.filter(l =>
                        l.message.toLowerCase().includes(searchLower) ||
                        (l.metadata && l.metadata.toLowerCase().includes(searchLower))
                    );
                }

                const limitedLogs = filteredLogs.slice(0, input.limit);

                return {
                    logs: limitedLogs,
                    total: filteredLogs.length
                };

            } catch (error) {
                console.error("Failed to read logs:", error);
                return { logs: [], total: 0 };
            }
        }),

    getStats: publicProcedure
        .input(
            z.object({
                signature: z.string(),
                timestamp: z.number(),
                address: z.string(),
            })
        )
        .query(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            try {
                if (!fs.existsSync(LOG_FILE_PATH)) {
                    return { errorCount: 0, warningCount: 0, totalCount: 0 };
                }

                const fileContent = fs.readFileSync(LOG_FILE_PATH, "utf-8");
                const errorCount = (fileContent.match(/\[ERROR\]/g) || []).length;
                const warningCount = (fileContent.match(/\[WARN\]/g) || []).length;
                const totalCount = fileContent.split("\n").filter(l => l.trim()).length;

                return { errorCount, warningCount, totalCount };
            } catch (error) {
                return { errorCount: 0, warningCount: 0, totalCount: 0 };
            }
        }),

    analyzeLog: publicProcedure
        .input(
            z.object({
                signature: z.string(),
                timestamp: z.number(),
                address: z.string(),
                logMessage: z.string(),
                context: z.string().optional(),
            })
        )
        .mutation(async ({ input }) => {
            const authResult = await verifyAdminSignature(
                input.signature,
                input.timestamp,
                input.address
            );

            if (!authResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: authResult.error });
            }

            const analysis = await analyzeLogEntry(input.logMessage, input.context);
            return { analysis };
        })
});
