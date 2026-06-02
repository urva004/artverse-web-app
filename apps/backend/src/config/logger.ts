// ═══════════════════════════════════════════════════
// ArtVerse — Winston Logger
// ═══════════════════════════════════════════════════

import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const prodFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const log = {
    timestamp,
    level,
    message: stack || message,
    ...(Object.keys(meta).length > 0 && { meta }),
  };
  return JSON.stringify(log);
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "debug",
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" })
  ),
  defaultMeta: { service: "artverse-api" },
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === "production"
          ? prodFormat
          : combine(colorize(), devFormat),
    }),
    // File transport for errors in production
    ...(process.env.NODE_ENV === "production"
      ? [
          new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: "logs/combined.log",
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
});

export default logger;
