// ═══════════════════════════════════════════════════
// ArtVerse — Direct Message Controller
// ═══════════════════════════════════════════════════

import type { Request, Response } from "express";
import { getIO } from "../config/socket";
import { prisma } from "../config/database";
import { asyncHandler, AppError } from "../middleware/errorHandler";
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

export const editDirectMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await directMessageService.editDirectMessage(req.params.messageId, req.user!.userId, req.body.content);

  try {
    const io = getIO();
    io.to(`user:${message.senderId}`).to(`user:${message.recipientId}`).emit("direct:message:update", message);
  } catch {
    // Socket is optional
  }

  res.json({ success: true, data: message, message: "Message updated" });
});

export const deleteDirectMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await prisma.directMessage.findUnique({
    where: { id: req.params.messageId },
  });
  if (!message) throw new AppError("Message not found", 404);
  const { senderId, recipientId } = message;

  await directMessageService.deleteDirectMessage(req.params.messageId, req.user!.userId);

  try {
    const io = getIO();
    io.to(`user:${senderId}`).to(`user:${recipientId}`).emit("direct:message:delete", { id: req.params.messageId });
  } catch {
    // Socket is optional
  }

  res.json({ success: true, message: "Message deleted" });
});

export const reactToDirectMessage = asyncHandler(async (req: Request, res: Response) => {
  const { emoji } = req.body;
  if (!emoji) throw new AppError("Emoji is required", 400);

  const message = await directMessageService.reactToDirectMessage(req.params.messageId, req.user!.userId, emoji);

  try {
    const io = getIO();
    io.to(`user:${message.senderId}`).to(`user:${message.recipientId}`).emit("direct:message:update", message);
  } catch {
    // Socket is optional
  }

  res.json({ success: true, data: message, message: "Reaction updated" });
});