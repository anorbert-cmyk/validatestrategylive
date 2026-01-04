import winston from "winston";

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for development (readable)
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let meta = "";
    if (Object.keys(metadata).length > 0) {
        meta = ` ${JSON.stringify(metadata)}`;
    }
    return `${timestamp} [${level}]: ${message}${meta}`;
});

// Create the logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "warn" : "debug",
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        process.env.NODE_ENV === "production" ? json() : devFormat
    ),
    transports: [
        new winston.transports.Console({
            format: combine(
                colorize({ all: process.env.NODE_ENV !== "production" }),
                timestamp({ format: "HH:mm:ss" }),
                devFormat
            ),
        }),
    ],
    // Don't exit on handled exceptions
    exitOnError: false,
});

// Production: add file transports
if (process.env.NODE_ENV === "production") {
    logger.add(
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
    logger.add(
        new winston.transports.File({
            filename: "logs/combined.log",
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        })
    );
}

// Export convenience functions
export const log = {
    info: (message: string, meta?: Record<string, unknown>) => logger.info(message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
    error: (message: string, meta?: Record<string, unknown>) => logger.error(message, meta),
    debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),
};

export default logger;
