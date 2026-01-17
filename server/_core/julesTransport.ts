import TransportStream from "winston-transport";
import { logWatcherService } from "../services/logWatcherService";

interface JulesTransportOptions extends TransportStream.TransportStreamOptions {
    // Custom options if needed
}

export class JulesTransport extends TransportStream {
    constructor(opts?: JulesTransportOptions) {
        super(opts);
    }

    log(info: any, callback: () => void) {
        setImmediate(() => {
            this.emit("logged", info);
        });

        if (info.level === "error") {
            // Extract message and metadata
            // Info object usually has: level, message, timestamp, stack, [Symbol(splat)]
            const message = info.message;
            const stack = info.stack;

            // Combine message and stack for context
            const fullContext = stack ? `${message}\n${stack}` : message;

            // Send to watcher (Fire and forget, non-blocking)
            // We pass the RAW message/stack to the service, it handles hashing
            // Use 'fullContext' as the message content for analysis
            logWatcherService.processError(fullContext, info);
        }

        callback();
    }
}
