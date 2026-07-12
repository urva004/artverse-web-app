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
  replyToId?: string;
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

  let finalMetadata = data.metadata || {};
  if (data.replyToId) {
    const replyToMessage = await prisma.directMessage.findUnique({
      where: { id: data.replyToId },
      include: { sender: { select: { name: true } } },
    });
    if (replyToMessage) {
      finalMetadata = {
        ...(finalMetadata as object),
        replyTo: {
          id: replyToMessage.id,
          senderName: replyToMessage.sender.name,
          content: replyToMessage.content.slice(0, 100) + (replyToMessage.content.length > 100 ? "..." : ""),
        },
      };
    }
  }

  const message = await prisma.directMessage.create({
    data: {
      senderId,
      recipientId,
      content: data.content,
      ...(data.imageUrl && { imageUrl: data.imageUrl }),
      metadata: finalMetadata as any,
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

/** Edit a direct message */
export async function editDirectMessage(messageId: string, userId: string, content: string) {
  const message = await prisma.directMessage.findUnique({
    where: { id: messageId },
  });
  if (!message) throw new AppError("Message not found", 404);
  if (message.senderId !== userId) throw new AppError("You can only edit your own messages", 403);

  return prisma.directMessage.update({
    where: { id: messageId },
    data: { content },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      recipient: { select: { id: true, name: true, avatar: true } },
    },
  });
}

/** Delete a direct message */
export async function deleteDirectMessage(messageId: string, userId: string) {
  const message = await prisma.directMessage.findUnique({
    where: { id: messageId },
  });
  if (!message) throw new AppError("Message not found", 404);
  if (message.senderId !== userId) throw new AppError("You can only delete your own messages", 403);

  return prisma.directMessage.delete({
    where: { id: messageId },
  });
}

/** React to a direct message */
export async function reactToDirectMessage(messageId: string, userId: string, emoji: string) {
  const message = await prisma.directMessage.findUnique({
    where: { id: messageId },
  });
  if (!message) throw new AppError("Message not found", 404);

  let metadata = (message.metadata as Record<string, any> | null) || {};
  let reactions = (metadata.reactions as Array<{ emoji: string; userIds: string[] }> | null) || [];

  const existingEmojiReaction = reactions.find((r) => r.emoji === emoji);
  if (existingEmojiReaction) {
    if (existingEmojiReaction.userIds.includes(userId)) {
      existingEmojiReaction.userIds = existingEmojiReaction.userIds.filter((id) => id !== userId);
    } else {
      existingEmojiReaction.userIds.push(userId);
    }
  } else {
    reactions.push({ emoji, userIds: [userId] });
  }

  reactions = reactions.filter((r) => r.userIds.length > 0);

  metadata = {
    ...metadata,
    reactions,
  };

  const updatedMessage = await prisma.directMessage.update({
    where: { id: messageId },
    data: { metadata: metadata as any },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
  });

  return updatedMessage;
}