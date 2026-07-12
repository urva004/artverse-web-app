// ═══════════════════════════════════════════════════
// ArtVerse — Group Controller
// ═══════════════════════════════════════════════════

import type { Request, Response } from "express";
import { getIO } from "../config/socket";
import { prisma } from "../config/database";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import * as groupService from "../services/group.service";
import * as messageService from "../services/message.service";

export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const group = await groupService.createGroup(req.user!.userId, req.body);
  res.status(201).json({ success: true, data: group, message: "Group created" });
});

export const getGroups = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string | undefined;
  const myGroups = req.query.my === "true" ? req.user?.userId : undefined;
  const result = await groupService.getGroups(page, limit, search, myGroups);
  res.json({ success: true, ...result });
});

export const getGroup = asyncHandler(async (req: Request, res: Response) => {
  const group = await groupService.getGroupById(req.params.id, req.user?.userId);
  res.json({ success: true, data: group });
});

export const joinGroup = asyncHandler(async (req: Request, res: Response) => {
  const result = await groupService.joinGroup(req.params.id, req.user!.userId);
  res.json({ success: true, data: result, message: "Joined group" });
});

export const leaveGroup = asyncHandler(async (req: Request, res: Response) => {
  const result = await groupService.leaveGroup(req.params.id, req.user!.userId);
  res.json({ success: true, data: result, message: "Left group" });
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const before = req.query.before as string | undefined;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await messageService.getMessages(req.params.id, req.user!.userId, before, limit);
  res.json({
    success: true,
    data: result.messages,
    messages: result.messages,
    next_cursor: result.nextCursor,
    has_more: result.hasMore,
  });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await messageService.sendMessage(req.params.id, req.user!.userId, req.body);

  try {
    const io = getIO();
    io.to(`group:${req.params.id}`).emit("message:new", message);
  } catch {
    // Socket is optional for HTTP message sends.
  }

  res.status(201).json({ success: true, data: message, message: "Message sent" });
});

export const editMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await messageService.editMessage(req.params.messageId, req.user!.userId, req.body.content);

  try {
    const io = getIO();
    io.to(`group:${message.groupId}`).emit("message:update", message);
  } catch {
    // Socket is optional
  }

  res.json({ success: true, data: message, message: "Message updated" });
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await prisma.message.findUnique({
    where: { id: req.params.messageId },
  });
  if (!message) throw new AppError("Message not found", 404);
  const groupId = message.groupId;

  await messageService.deleteMessage(req.params.messageId, req.user!.userId);

  try {
    const io = getIO();
    io.to(`group:${groupId}`).emit("message:delete", { id: req.params.messageId });
  } catch {
    // Socket is optional
  }

  res.json({ success: true, message: "Message deleted" });
});

export const reactToMessage = asyncHandler(async (req: Request, res: Response) => {
  const { emoji } = req.body;
  if (!emoji) throw new AppError("Emoji is required", 400);

  const message = await messageService.reactToMessage(req.params.messageId, req.user!.userId, emoji);

  try {
    const io = getIO();
    io.to(`group:${message.groupId}`).emit("message:update", message);
  } catch {
    // Socket is optional
  }

  res.json({ success: true, data: message, message: "Reaction updated" });
});
