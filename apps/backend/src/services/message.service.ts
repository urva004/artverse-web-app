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

  const message = await prisma.message.create({
    data: {
      groupId,
      senderId,
      content: data.content,
      ...(data.imageUrl && { imageUrl: data.imageUrl }),
      ...(data.metadata && { metadata: data.metadata }),
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
