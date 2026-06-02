// ═══════════════════════════════════════════════════
// ArtVerse — Product Controller
// ═══════════════════════════════════════════════════

import type { Request, Response } from "express";
import type { ProductFilterInput } from "@artverse/utils";

import { asyncHandler } from "../middleware/errorHandler";
import * as productService from "../services/product.service";

/**
 * GET /products
 */
export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.getProducts(req.query as never);

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * GET /products/trending
 */
export const getTrending = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const data = await productService.getTrendingProducts(limit);

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /products/search?q=
 */
export const searchProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const search = req.query.q as string;
    const result = await productService.getProducts({
      search,
      sortBy: (req.query.sortBy as ProductFilterInput["sortBy"] | undefined) ?? "newest",
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  }
);

/**
 * GET /products/:id
 */
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip = typeof forwardedFor === "string" ? forwardedFor.split(",")[0] : req.socket.remoteAddress || "127.0.0.1";

  const data = await productService.getProductById(
    req.params.id,
    req.user?.userId,
    ip
  );

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * GET /products/user
 * Gets all products specifically owned by the logged-in user for dashboard management.
 */
export const getUserProducts = asyncHandler(async (req: Request, res: Response) => {
  const data = await productService.getProductsBySellerId(req.user!.userId);

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * POST /products
 */
export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const data = await productService.createProduct(
      req.user!.userId,
      req.body,
      files
    );

    res.status(201).json({
      success: true,
      data,
      message: "Product created successfully",
    });
  }
);

/**
 * PUT /products/:id
 */
export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const data = await productService.updateProduct(
      req.params.id,
      req.user!.userId,
      req.body,
      files
    );

    res.status(200).json({
      success: true,
      data,
      message: "Product updated successfully",
    });
  }
);

/**
 * DELETE /products/:id
 */
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    await productService.deleteProduct(
      req.params.id,
      req.user!.userId,
      req.user!.role
    );

    res.status(200).json({
      success: true,
      data: null,
      message: "Product deleted successfully",
    });
  }
);
