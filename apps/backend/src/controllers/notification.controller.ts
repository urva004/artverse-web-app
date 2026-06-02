// ═══════════════════════════════════════════════════
// ArtVerse — Notification Controller
// ═══════════════════════════════════════════════════

import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import * as notificationService from "../services/notification.service";

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const result = await notificationService.getNotifications(req.user!.userId, page);
  res.json({ success: true, ...result });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markAsRead(req.params.id, req.user!.userId);
  res.json({ success: true, message: "Marked as read" });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markAllAsRead(req.user!.userId);
  res.json({ success: true, message: "All notifications marked as read" });
});
