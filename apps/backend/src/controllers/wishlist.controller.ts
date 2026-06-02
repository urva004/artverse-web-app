// ═══════════════════════════════════════════════════
// ArtVerse — Wishlist Controller
// ═══════════════════════════════════════════════════

import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import * as wishlistService from "../services/wishlist.service";

/** POST /wishlist/:productId */
export const toggleWishlist = asyncHandler(async (req: Request, res: Response) => {
  const result = await wishlistService.toggleWishlist(req.user!.userId, req.params.productId);
  res.json({ success: true, data: result, message: result.wishlisted ? "Added to wishlist" : "Removed from wishlist" });
});

/** GET /wishlist */
export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await wishlistService.getWishlist(req.user!.userId, page, limit);
  res.json({ success: true, ...result });
});
