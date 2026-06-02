// ═══════════════════════════════════════════════════
// ArtVerse — Notification Service
// ═══════════════════════════════════════════════════

import { prisma } from "../config/database";
import type { NotificationType, Prisma } from "@prisma/client";

/** Create a notification */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  metadata?: Prisma.InputJsonValue
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      link,
      ...(metadata !== undefined ? { metadata } : {}),
    },
  });
}

/** Get user notifications (paginated) */
export async function getNotifications(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    data: notifications,
    unreadCount,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
  };
}

/** Mark single notification as read */
export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!notification) return null;

  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
}

/** Mark all as read */
export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  return { success: true };
}
