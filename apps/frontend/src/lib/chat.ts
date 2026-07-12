export interface ChatTimelineSender {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface ChatTimelineMessage {
  id: string;
  content: string;
  createdAt: string | Date;
  imageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  sender: ChatTimelineSender;
  recipient?: ChatTimelineSender;
  groupId?: string;
}

export function sortChatMessages<T extends ChatTimelineMessage>(messages: T[]) {
  return [...messages].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();

    if (leftTime === rightTime) {
      return left.id.localeCompare(right.id);
    }

    return leftTime - rightTime;
  });
}

export function mergeChatMessages<T extends ChatTimelineMessage>(current: T[], incoming: T[]) {
  const byId = new Map<string, T>();

  for (const message of current) {
    byId.set(message.id, message);
  }

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return sortChatMessages(Array.from(byId.values()));
}

export function getChatRowMeta<T extends ChatTimelineMessage>(
  messages: T[],
  index: number,
  currentUserId?: string
) {
  const message = messages[index];
  if (!message) {
    return {
      isMe: false,
      showAvatar: true,
    };
  }
  const previousMessage = messages[index - 1];
  const isMe = message.sender.id === currentUserId;
  const isSameUserAsPrev = previousMessage?.sender.id === message.sender.id;
  const isCloseInTime = previousMessage
    ? new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() < 5 * 60 * 1000
    : false;

  return {
    isMe,
    showAvatar: !(isSameUserAsPrev && isCloseInTime),
  };
}

export function estimateChatRowHeight<T extends ChatTimelineMessage>(
  message: T,
  showAvatar: boolean
) {
  const textLength = message.content?.trim().length ?? 0;
  // showAvatar adds sender name + avatar spacing; otherwise tight grouping
  const baseHeight = showAvatar ? 72 : 48;
  // roughly 34 chars per line at 20px line height
  const lineCount = Math.max(1, Math.ceil(textLength / 34));
  const textHeight = lineCount * 20 + 20; // +20 for bubble padding
  const hasAttachment = !!message.imageUrl;
  const hasArtwork = Boolean((message.metadata as { artwork?: unknown } | undefined)?.artwork);

  return baseHeight + textHeight + (hasAttachment ? 260 : 0) + (hasArtwork ? 300 : 0);
}

export function scrollContainerIsNearBottom(element: HTMLElement, threshold = 140) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
}