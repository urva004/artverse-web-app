// ═══════════════════════════════════════════════════
// ArtVerse — Order Controller
// ═══════════════════════════════════════════════════

import type { Request, Response } from "express";

import { asyncHandler } from "../middleware/errorHandler";
import * as orderService from "../services/order.service";

/**
 * POST /orders
 */
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const result = await orderService.createOrder(req.user!.userId, req.body);

  res.status(201).json({
    success: true,
    data: result,
    message: "Order created. Complete payment to confirm.",
  });
});

/**
 * POST /orders/verify
 */
export const verifyPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const order = await orderService.verifyPayment(req.body);

    res.status(200).json({
      success: true,
      data: order,
      message: "Payment verified successfully",
    });
  }
);

/**
 * GET /orders/my
 */
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await orderService.getMyOrders(
    req.user!.userId,
    page,
    limit
  );

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * GET /orders/:id
 */
export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderById(
    req.params.id,
    req.user!.userId
  );

  res.status(200).json({
    success: true,
    data: order,
  });
});
