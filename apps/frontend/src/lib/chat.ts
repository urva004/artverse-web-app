// ═══════════════════════════════════════════════════
// ArtVerse — Chat Utilities & Timeline Builder
// ═══════════════════════════════════════════════════

export interface ChatTimelineSender {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface ChatTimelineMessage {
  id: string;
  content: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  imageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  sender: ChatTimelineSender;
  recipient?: ChatTimelineSender;
  groupId?: string;
}

// ── Timeline items: a message or a date-separator row ──

export type ChatTimelineItem =
  | ({ kind: "message" } & ChatTimelineMessage)
  | { kind: "date-separator"; id: string; label: string; date: Date };

// ── Sort raw messages chronologically ──

export function sortChatMessages<T extends ChatTimelineMessage>(messages: T[]) {
  return [...messages].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();
    if (leftTime === rightTime) return left.id.localeCompare(right.id);
    return leftTime - rightTime;
  });
}

// ── Merge incoming messages without duplicates, keep sorted ──

export function mergeChatMessages<T extends ChatTimelineMessage>(current: T[], incoming: T[]) {
  const byId = new Map<string, T>();
  for (const message of current) byId.set(message.id, message);
  for (const message of incoming) byId.set(message.id, message);
  return sortChatMessages(Array.from(byId.values()));
}

// ── Format a Date into a human-readable day label ──

function formatDayLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDay.getTime() === today.getTime()) return "Today";
  if (msgDay.getTime() === yesterday.getTime()) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── Build the full chat timeline (messages + date separators) ──

export function buildChatTimeline(messages: ChatTimelineMessage[]): ChatTimelineItem[] {
  const sorted = sortChatMessages(messages);
  const items: ChatTimelineItem[] = [];
  let lastDayKey = "";

  for (const msg of sorted) {
    const date = new Date(msg.createdAt);
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    if (dayKey !== lastDayKey) {
      lastDayKey = dayKey;
      items.push({
        kind: "date-separator",
        id: `sep-${dayKey}`,
        label: formatDayLabel(date),
        date,
      });
    }

    items.push({ kind: "message", ...msg });
  }

  return items;
}

// ── Row metadata (grouping logic) ──

export function getChatRowMeta(
  items: ChatTimelineItem[],
  index: number,
  currentUserId?: string
) {
  const item = items[index];

  if (!item || item.kind !== "message") {
    return { isMe: false, showUsername: false, showAvatar: false };
  }

  // Walk backward to find previous message (skip separators)
  const prevMsg = (() => {
    for (let i = index - 1; i >= 0; i--) {
      if (items[i]?.kind === "message") return items[i] as ChatTimelineItem & { kind: "message" };
    }
    return null;
  })();

  // Walk forward to find next message (skip separators)
  const nextMsg = (() => {
    for (let i = index + 1; i < items.length; i++) {
      if (items[i]?.kind === "message") return items[i] as ChatTimelineItem & { kind: "message" };
    }
    return null;
  })();

  const isMe = item.sender.id === currentUserId;

  const isSameUserAsPrev =
    prevMsg?.sender.id === item.sender.id &&
    new Date(item.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 5 * 60 * 1000;

  const isSameUserAsNext =
    nextMsg?.sender.id === item.sender.id &&
    new Date(nextMsg.createdAt).getTime() - new Date(item.createdAt).getTime() < 5 * 60 * 1000;

  // If there's a separator between prev and current, break the group
  const separatorBetweenPrev =
    index > 0 && items[index - 1]?.kind === "date-separator";

  const showUsername = !isMe && (!isSameUserAsPrev || separatorBetweenPrev);
  const showAvatar = !isMe && !isSameUserAsNext;

  return { isMe, showUsername, showAvatar };
}

// ── Row height estimation for the virtualized list ──

const DATE_SEPARATOR_HEIGHT = 36; // px

export function estimateChatRowHeight(
  item: ChatTimelineItem,
  meta: { isMe: boolean; showUsername: boolean; showAvatar: boolean }
): number {
  if (item.kind === "date-separator") return DATE_SEPARATOR_HEIGHT;

  const textLength = item.content?.trim().length ?? 0;

  // More accurate: assume ~36 chars/line on mobile, ~52 on desktop.
  // We use 42 as a conservative average — better than 45 which under-counts.
  const charsPerLine = 42;
  const lineCount = textLength > 0 ? Math.ceil(textLength / charsPerLine) : 0;
  const textHeight = lineCount > 0 ? lineCount * 22 + 20 : 0; // 22px line-height + 20px padding

  const hasAttachment = !!item.imageUrl;
  const hasArtwork = Boolean((item.metadata as { artwork?: unknown } | undefined)?.artwork);
  const hasReply = Boolean((item.metadata as { replyTo?: unknown } | undefined)?.replyTo);
  const hasReactions = Boolean(
    ((item.metadata as { reactions?: unknown[] } | undefined)?.reactions ?? []).length > 0
  );

  const attachmentHeight = hasAttachment ? 230 : 0;
  const artworkHeight = hasArtwork ? 240 : 0;
  const replyHeight = hasReply ? 56 : 0;
  const reactionHeight = hasReactions ? 32 : 0;

  let height =
    textHeight +
    attachmentHeight +
    artworkHeight +
    replyHeight +
    reactionHeight +
    20; // base vertical padding

  if (meta.showUsername) height += 24;
  if (meta.showAvatar) height = Math.max(60, height + 10);
  else height = Math.max(36, height + 2);

  return height;
}

export function scrollContainerIsNearBottom(element: HTMLElement, threshold = 140) {
  return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
}