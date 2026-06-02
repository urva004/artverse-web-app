// ═══════════════════════════════════════════════════
// ArtVerse — Zod Validation Middleware
// ═══════════════════════════════════════════════════

import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

/**
 * Validate request body against a Zod schema
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      res.status(400).json({
        success: false,
        message: `Validation failed: ${result.error.errors.map(e => e.path.join(".") + " - " + e.message).join(", ")}`,
        errors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

/**
 * Validate request query params against a Zod schema
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors,
      });
      return;
    }

    req.query = result.data;
    next();
  };
}

/**
 * Validate request params against a Zod schema
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      res.status(400).json({
        success: false,
        message: "Invalid URL parameters",
        errors,
      });
      return;
    }

    req.params = result.data;
    next();
  };
}
