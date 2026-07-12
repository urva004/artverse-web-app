// ═══════════════════════════════════════════════════
// ArtVerse — Global Error Handler
// ═══════════════════════════════════════════════════

import type { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";

import { logger } from "../config/logger";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: [],
    });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  // Multer file upload errors
  if (err instanceof MulterError) {
    const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large. Maximum size is 5MB."
        : `Upload error: ${err.message}`;
    const field = err.field || "images";
    res.status(statusCode).json({
      success: false,
      message,
      errors: [
        {
          field,
          message,
        },
      ],
    });
    return;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      message: "Invalid token.",
      errors: [],
    });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      message: "Token expired.",
      errors: [],
    });
    return;
  }

  // Prisma errors
  if (err.name === "PrismaClientKnownRequestError" || 
      err.name === "PrismaClientValidationError" ||
      err.name === "PrismaClientUnknownRequestError" ||
      err.name === "PrismaClientInitializationError") {
    logger.error("Prisma Error: " + err.message);
    res.status(500).json({
      success: false,
      message: "A database error occurred. Please try again in a moment.",
      errors: [],
      error: process.env.NODE_ENV === "production" ? undefined : err.message,
    });
    return;
  }

  // Unknown / internal errors
  logger.error("Unhandled error: " + err.message);
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    errors: [],
  });
}

/**
 * Async route handler wrapper — catches async errors automatically
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
