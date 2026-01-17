import Transport from "winston-transport";
import type { LogEntry } from "winston";
import { logWatcherService } from "../services/logWatcherService";

/**
 * Custom Winston Transport for Jules AI Sentinel.
 * Intercepts ERROR level logs and queues them for AI analysis.
 */
export class JulesTransport extends Transport {
    constructor(opts?: Transport.TransportStreamOptions) {
        super(opts);
    }

    log(info: LogEntry, callback: () => void): void {
        // Emit 'logged' event asynchronously (Winston convention)
        setImmediate(() => {
            this.emit("logged", info);
        });

        // Only process error-level logs
        if (info.level === "error") {
            const message = typeof info.message === "string" ? info.message : String(info.message);
            const stack = (info as Record<string, unknown>).stack as string | undefined;

            // Combine message and stack for context
            const fullContext = stack ? `${message}\n${stack}` : message;

            // Send to watcher (Fire and forget, non-blocking)
            logWatcherService.processError(fullContext, info);
        }

        callback();
    }
}
