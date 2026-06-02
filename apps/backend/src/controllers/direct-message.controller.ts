// ═══════════════════════════════════════════════════
// ArtVerse — Direct Message Controller
// ═══════════════════════════════════════════════════

import type { Request, Response } from "express";
import { getIO } from "../config/socket";
import { asyncHandler } from "../middleware/errorHandler";
import * as directMessageService from "../services/direct-message.service";

export const sendDirectMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await directMessageService.sendDirectMessage(req.user!.userId, req.params.id, req.body);

  try {
    const io = getIO();
    io.to(`user:${req.user!.userId}`).emit("direct:message:new", message);
    io.to(`user:${req.params.id}`).emit("direct:message:new", message);
  } catch {
    // Socket is optional for direct messages.
  }

  res.status(201).json({ success: true, data: message, message: "Message sent" });
});

export const getDirectMessages = asyncHandler(async (req: Request, res: Response) => {
  const before = req.query.before as string | undefined;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await directMessageService.getDirectMessages(req.user!.userId, req.params.id, before, limit);

  res.json({
    success: true,
    data: result.messages,
    messages: result.messages,
    next_cursor: result.nextCursor,
    has_more: result.hasMore,
  });
});