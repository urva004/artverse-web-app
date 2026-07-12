// ═══════════════════════════════════════════════════
// ArtVerse — Message Service
// ═══════════════════════════════════════════════════

import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { createNotification } from "./notification.service";

interface SendGroupMessageInput {
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

/** Send a message in a group */
export async function sendMessage(groupId: string, senderId: string, data: SendGroupMessageInput) {
  // Verify membership
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: senderId } },
  });
  if (!member) throw new AppError("You must be a member to send messages", 403);

  let finalMetadata = data.metadata || {};
  if (data.replyToId) {
    const replyToMessage = await prisma.message.findUnique({
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

  const message = await prisma.message.create({
    data: {
      groupId,
      senderId,
      content: data.content,
      ...(data.imageUrl && { imageUrl: data.imageUrl }),
      metadata: finalMetadata as any,
    },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  });

  const members = await prisma.groupMember.findMany({
    where: { groupId, NOT: { userId: senderId } },
    select: { userId: true },
  });

  const artworkTitle = getArtworkTitle(data.metadata);
  const notificationTitle = artworkTitle ? "Artwork shared" : "New community message";
  const notificationMessage = artworkTitle
    ? `${message.sender.name} shared "${artworkTitle}" in the group chat.`
    : `${message.sender.name} posted a message in the group chat.`;

  await Promise.all(
    members.map((member) =>
      createNotification(
        member.userId,
        NotificationType.COMMUNITY_MESSAGE,
        notificationTitle,
        notificationMessage,
        `/community/${groupId}`
      )
    )
  );

  return message;
}

function buildOlderMessagesWhere(groupId: string, cursor?: { id: string; createdAt: Date }) {
  if (!cursor) {
    return { groupId };
  }

  return {
    groupId,
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } },
    ],
  };
}

/** Get messages for a group using reverse cursor pagination */
export async function getMessages(groupId: string, userId: string, before?: string, limit = 20): Promise<ChatHistoryResult<unknown>> {
  // Verify membership
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!member) throw new AppError("You must be a member to view messages", 403);

  const cursor = before
    ? await prisma.message.findFirst({
        where: { id: before, groupId },
        select: { id: true, createdAt: true },
      })
    : null;

  if (before && !cursor) {
    throw new AppError("Cursor not found", 404);
  }

  const messages = await prisma.message.findMany({
    where: buildOlderMessagesWhere(groupId, cursor ?? undefined),
    take: limit + 1,
    include: { sender: { select: { id: true, name: true, avatar: true } } },
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

/** Edit a message in a group */
export async function editMessage(messageId: string, userId: string, content: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (!message) throw new AppError("Message not found", 404);
  if (message.senderId !== userId) throw new AppError("You can only edit your own messages", 403);

  return prisma.message.update({
    where: { id: messageId },
    data: { content },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  });
}

/** Delete a message in a group */
export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (!message) throw new AppError("Message not found", 404);
  if (message.senderId !== userId) throw new AppError("You can only delete your own messages", 403);

  return prisma.message.delete({
    where: { id: messageId },
  });
}

/** React to a message in a group */
export async function reactToMessage(messageId: string, userId: string, emoji: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (!message) throw new AppError("Message not found", 404);

  let metadata = (message.metadata as Record<string, any> | null) || {};
  let reactions = (metadata.reactions as Array<{ emoji: string; userIds: string[] }> | null) || [];

  const existingEmojiReaction = reactions.find((r) => r.emoji === emoji);
  if (existingEmojiReaction) {
    if (existingEmojiReaction.userIds.includes(userId)) {
      // Toggle off: remove reaction
      existingEmojiReaction.userIds = existingEmojiReaction.userIds.filter((id) => id !== userId);
    } else {
      // Toggle on: add user reaction
      existingEmojiReaction.userIds.push(userId);
    }
  } else {
    // Add new emoji reaction
    reactions.push({ emoji, userIds: [userId] });
  }

  // Filter out any reaction configurations that have 0 userIds
  reactions = reactions.filter((r) => r.userIds.length > 0);

  // Update metadata
  metadata = {
    ...metadata,
    reactions,
  };

  const updatedMessage = await prisma.message.update({
    where: { id: messageId },
    data: { metadata: metadata as any },
    include: { sender: { select: { id: true, name: true, avatar: true } } },
  });

  return updatedMessage;
}
