// ═══════════════════════════════════════════════════
// ArtVerse — Socket.io Server Setup
// ═══════════════════════════════════════════════════

import type { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config";
import { logger } from "../config/logger";
import * as messageService from "../services/message.service";

let io: SocketIOServer;

export function initSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
    transports: ["websocket", "polling"],
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };
      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    logger.info(`🔌 Socket connected: ${userId}`);

    // Join the user's personal room for notifications
    socket.join(`user:${userId}`);

    // ── Join group room ──
    socket.on("join:group", (groupId: string) => {
      socket.join(`group:${groupId}`);
      logger.info(`User ${userId} joined group room ${groupId}`);
    });

    // ── Leave group room ──
    socket.on("leave:group", (groupId: string) => {
      socket.leave(`group:${groupId}`);
    });

    // ── Send message ──
    socket.on(
      "message:send",
      async (data: { groupId: string; content: string; imageUrl?: string; metadata?: any; replyToId?: string }, callback) => {
        try {
          const message = await messageService.sendMessage(data.groupId, userId, {
            content: data.content,
            imageUrl: data.imageUrl,
            metadata: data.metadata,
            replyToId: data.replyToId,
          });
          io.to(`group:${data.groupId}`).emit("message:new", message);
          if (callback) callback({ success: true, data: message });
        } catch (error: any) {
          if (callback) callback({ success: false, error: error.message });
        }
      }
    );

    // ── Typing indicators ──
    socket.on("typing:start", (groupId: string) => {
      socket.to(`group:${groupId}`).emit("typing:user", { userId, groupId, typing: true });
    });

    socket.on("typing:stop", (groupId: string) => {
      socket.to(`group:${groupId}`).emit("typing:user", { userId, groupId, typing: false });
    });

    socket.on("disconnect", () => {
      logger.info(`🔌 Socket disconnected: ${userId}`);
    });
  });

  logger.info("⚡ Socket.io initialized");
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
