// ═══════════════════════════════════════════════════
// ArtVerse — Review Controller
// ═══════════════════════════════════════════════════

import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import * as reviewService from "../services/review.service";

/** POST /reviews/:productId */
export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.createReview(req.params.productId, req.user!.userId, req.body);
  res.status(201).json({ success: true, data: review, message: "Review submitted" });
});

/** GET /reviews/:productId */
export const getReviews = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await reviewService.getProductReviews(req.params.productId, page, limit);
  res.json({ success: true, ...result });
});
