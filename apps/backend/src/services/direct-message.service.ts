// ═══════════════════════════════════════════════════
// ArtVerse — Direct Message Service
// ═══════════════════════════════════════════════════

import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { createNotification } from "./notification.service";

interface SendDirectMessageInput {
  content: string;
  imageUrl?: string;
  metadata?: Prisma.InputJsonValue;
}

interface ChatHistoryResult<T> {
  messages: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

function getArtworkTitle(metadata?: Prisma.InputJsonValue) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }

  const artwork = (metadata as { artwork?: { title?: string } }).artwork;
  return artwork?.title;
}

export async function sendDirectMessage(senderId: string, recipientId: string, data: SendDirectMessageInput) {
  if (senderId === recipientId) {
    throw new AppError("You cannot message yourself", 400);
  }

  const recipient = await prisma.user.findFirst({
    where: { id: recipientId, isActive: true },
    select: { id: true, name: true, avatar: true, role: true },
  });

  if (!recipient) {
    throw new AppError("User not found", 404);
  }

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { id: true, name: true, avatar: true, role: true },
  });

  if (!sender) {
    throw new AppError("User not found", 404);
  }

  const message = await prisma.directMessage.create({
    data: {
      senderId,
      recipientId,
      content: data.content,
      ...(data.imageUrl && { imageUrl: data.imageUrl }),
      ...(data.metadata && { metadata: data.metadata }),
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
          email: true,
          bio: true,
          socialLinks: true,
          createdAt: true,
        },
      },
      recipient: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
          email: true,
          bio: true,
          socialLinks: true,
          createdAt: true,
        },
      },
    },
  });

  const artworkTitle = getArtworkTitle(data.metadata);
  const notificationMetadata = {
    senderId,
    recipientId,
    ...(artworkTitle ? { artworkTitle } : {}),
  };

  await createNotification(
    recipientId,
    NotificationType.PERSONAL_MESSAGE,
    "New message",
    artworkTitle
      ? `${sender.name} shared "${artworkTitle}" with you.`
      : `${sender.name} sent you a message.`,
    `/messages/${senderId}`,
    notificationMetadata
  );

  return message;
}

function buildOlderMessagesWhere(
  userId: string,
  otherUserId: string,
  cursor?: { id: string; createdAt: Date }
) {
  const conversationFilter = {
    OR: [
      { senderId: userId, recipientId: otherUserId },
      { senderId: otherUserId, recipientId: userId },
    ],
  };

  if (!cursor) {
    return conversationFilter;
  }

  return {
    AND: [
      conversationFilter,
      {
        OR: [
          { createdAt: { lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, id: { lt: cursor.id } },
        ],
      },
    ],
  };
}

export async function getDirectMessages(
  userId: string,
  otherUserId: string,
  before?: string,
  limit = 20
): Promise<ChatHistoryResult<unknown>> {
  const otherUser = await prisma.user.findFirst({
    where: { id: otherUserId, isActive: true },
    select: { id: true },
  });

  if (!otherUser) {
    throw new AppError("User not found", 404);
  }

  const cursor = before
    ? await prisma.directMessage.findFirst({
        where: {
          id: before,
          OR: [
            { senderId: userId, recipientId: otherUserId },
            { senderId: otherUserId, recipientId: userId },
          ],
        },
        select: { id: true, createdAt: true },
      })
    : null;

  if (before && !cursor) {
    throw new AppError("Cursor not found", 404);
  }

  const messages = await prisma.directMessage.findMany({
    where: buildOlderMessagesWhere(userId, otherUserId, cursor ?? undefined),
    take: limit + 1,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
          email: true,
          bio: true,
          socialLinks: true,
          createdAt: true,
        },
      },
      recipient: {
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
          email: true,
          bio: true,
          socialLinks: true,
          createdAt: true,
        },
      },
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
  });

  const hasMore = messages.length > limit;
  const pageMessages = hasMore ? messages.slice(0, limit) : messages;
  const orderedMessages = pageMessages.reverse();

  return {
    messages: orderedMessages,
    nextCursor: hasMore ? orderedMessages[0]?.id ?? null : null,
    hasMore,
  };
}