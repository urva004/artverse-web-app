// ═══════════════════════════════════════════════════
// ArtVerse — Product Routes
// ═══════════════════════════════════════════════════

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";

import { createProductSchema, updateProductSchema, productFilterSchema } from "@artverse/utils";
import { UserRole } from "@artverse/utils";

import * as productController from "../controllers/product.controller";
import { authenticate, authorize, optionalAuth } from "../middleware/auth";
import { uploadLimiter } from "../middleware/rateLimiter";
import { uploadMultiple } from "../middleware/upload";
import { validateBody, validateQuery } from "../middleware/validate";

/**
 * Preprocess multipart/form-data body to convert string values
 * into proper types before Zod validation.
 * FormData sends everything as strings — this middleware coerces
 * them back to the types the Zod schema expects.
 */
function preprocessMultipart(req: Request, _res: Response, next: NextFunction) {
  // Remove empty string values (so partial updates work with updateProductSchema)
  for (const key of Object.keys(req.body)) {
    if (req.body[key] === "" || req.body[key] === "undefined") {
      delete req.body[key];
    }
  }

  // Coerce numeric fields
  if (req.body.price != null) {
    req.body.price = Number(req.body.price);
  }
  if (req.body.stock != null) {
    req.body.stock = Number(req.body.stock);
  }

  if (typeof req.body.removedImageUrls === "string") {
    try {
      req.body.removedImageUrls = JSON.parse(req.body.removedImageUrls);
    } catch {
      req.body.removedImageUrls = req.body.removedImageUrls
        .split(",")
        .map((url: string) => url.trim())
        .filter(Boolean);
    }
  }

  // Coerce tags — JSON array string or comma-separated
  if (typeof req.body.tags === "string") {
    try {
      req.body.tags = JSON.parse(req.body.tags);
    } catch {
      req.body.tags = req.body.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    }
  }

  next();
}

const router = Router();

// Public routes
router.get(
  "/",
  optionalAuth,
  validateQuery(productFilterSchema),
  productController.getProducts
);

router.get("/trending", productController.getTrending);

router.get("/search", productController.searchProducts);

// Protected routes (Seller only)
router.get(
  "/user",
  authenticate,
  authorize(UserRole.SELLER, UserRole.ADMIN),
  productController.getUserProducts
);

router.get("/:id", optionalAuth, productController.getProduct);

// Protected routes (Seller only)
router.post(
  "/",
  authenticate,
  authorize(UserRole.SELLER, UserRole.ADMIN),
  uploadLimiter,
  uploadMultiple,
  preprocessMultipart,
  validateBody(createProductSchema),
  productController.createProduct
);

router.put(
  "/:id",
  authenticate,
  authorize(UserRole.SELLER, UserRole.ADMIN),
  uploadMultiple,
  preprocessMultipart,
  validateBody(updateProductSchema),
  productController.updateProduct
);

router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.SELLER, UserRole.ADMIN),
  productController.deleteProduct
);

export default router;
