import type { Request, Response } from "express";
import { CartService } from "../services/cart.service";
import { 
  addToCartSchema, 
  updateCartItemSchema, 
  syncCartSchema 
} from "@artverse/utils";
import { asyncHandler, AppError } from "../middleware/errorHandler";

/**
 * GET /cart
 */
export const getCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const cart = await CartService.getCart(userId);
  
  res.status(200).json({
    success: true,
    data: { cart },
  });
});

/**
 * POST /cart/items
 */
export const addItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const validated = addToCartSchema.parse(req.body);

  const cartItem = await CartService.addItem(
    userId, 
    validated.productId, 
    validated.quantity
  );

  res.status(201).json({
    success: true,
    data: { cartItem },
  });
});

/**
 * PATCH /cart/items/:productId
 */
export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { productId } = req.params;
  const validated = updateCartItemSchema.parse(req.body);

  if (!productId) {
    throw new AppError("Product ID is required", 400);
  }

  const cartItem = await CartService.updateItem(userId, productId, validated);

  res.status(200).json({
    success: true,
    data: { cartItem },
  });
});

/**
 * DELETE /cart/items/:productId
 */
export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { productId } = req.params;

  if (!productId) {
    throw new AppError("Product ID is required", 400);
  }

  await CartService.removeItem(userId, productId);

  res.status(204).json({
    success: true,
    data: null,
  });
});

/**
 * DELETE /cart
 */
export const clearCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  await CartService.clearCart(userId);

  res.status(204).json({
    success: true,
    data: null,
  });
});

/**
 * POST /cart/sync
 */
export const syncCart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const validated = syncCartSchema.parse(req.body);

  const cart = await CartService.syncGuestCart(userId, validated.items);

  res.status(200).json({
    success: true,
    data: { cart },
  });
});

/**
 * PATCH /cart/items/:productId/save
 */
export const toggleSaveForLater = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { productId } = req.params;
  const { save } = req.body;

  if (!productId) {
    throw new AppError("Product ID is required", 400);
  }

  const cartItem = await CartService.toggleSaveForLater(
    userId, 
    productId, 
    !!save
  );

  res.status(200).json({
    success: true,
    data: { cartItem },
  });
});
