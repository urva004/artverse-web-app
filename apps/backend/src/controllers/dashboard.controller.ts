// ═══════════════════════════════════════════════════
// ArtVerse — Dashboard Controller
// ═══════════════════════════════════════════════════

import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import * as dashboardService from "../services/dashboard.service";

/** GET /dashboard/seller */
export const getSellerDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await dashboardService.getSellerAnalytics(req.user!.userId);
  res.json({ success: true, data });
});

/** GET /dashboard/admin */
export const getAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await dashboardService.getAdminAnalytics();
  res.json({ success: true, data });
});

/** PUT /dashboard/admin/users/:id/toggle */
export const toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const user = await dashboardService.toggleUserStatus(req.params.id);
  res.json({ success: true, data: user, message: user?.isActive ? "User activated" : "User deactivated" });
});

/** PUT /dashboard/admin/products/:id/approve */
export const approveProduct = asyncHandler(async (req: Request, res: Response) => {
  const approved = req.body.approved !== false;
  const product = await dashboardService.setProductApproval(req.params.id, approved);
  res.json({ success: true, data: product, message: approved ? "Product approved" : "Product rejected" });
});

/** GET /orders/my */
export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const result = await dashboardService.getOrderHistory(req.user!.userId, page);
  res.json({ success: true, ...result });
});
