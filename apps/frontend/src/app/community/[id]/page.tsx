"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowDown, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { ListImperativeAPI } from "react-window";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { VirtualizedChatList } from "@/components/chat/VirtualizedChatList";
import type { ChatSendPayload } from "@/components/chat/types";
import { api } from "@/lib/api";
import {
  buildChatTimeline,
  estimateChatRowHeight,
  getChatRowMeta,
  mergeChatMessages,
  scrollContainerIsNearBottom,
  sortChatMessages,
  type ChatTimelineItem,
  type ChatTimelineMessage,
} from "@/lib/chat";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";

const PAGE_LIMIT = 20;

interface GroupMessagesResponse {
  messages?: ChatTimelineMessage[];
  data?: ChatTimelineMessage[];
  next_cursor?: string | null;
  has_more?: boolean;
}

// ── Date-separator row ─────────────────────────────

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 md:px-6" role="separator" aria-label={label}>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
      <span className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-0.5 text-[10px] font-semibold text-[var(--color-muted)] select-none">
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  );
}

// ── Page ───────────────────────────────────────────

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const {
    joinGroup,
    leaveGroup,
    sendMessage,
    onNewMessage,
    onUpdateMessage,
    onDeleteMessage,
    startTyping,
    stopTyping,
    onTyping,
  } = useSocket();

  const [rawMessages, setRawMessages] = useState<ChatTimelineMessage[]>([]);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState<ChatTimelineMessage | null>(null);
  const scrollContainerRef = useRef<ListImperativeAPI | null>(null);
  const pendingRestoreRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const pendingAutoScrollRef = useRef<ScrollBehavior | null>(null);
  const isAtBottomRef = useRef(true);
  const scrollDebounceRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // ── Build timeline with date separators ──
  const timelineItems = useMemo<ChatTimelineItem[]>(
    () => buildChatTimeline(rawMessages),
    [rawMessages]
  );

  // ── Resolve typing user names from member list ──
  const fetchMessages = useCallback(
    async (before?: string | null) => {
      if (!id) return null;
      const response = await api.get(`/groups/${id}/messages`, {
        params: { before: before || undefined, limit: PAGE_LIMIT },
      });
      return response.data as GroupMessagesResponse;
    },
    [id]
  );

  const { data: group, isLoading } = useQuery({
    queryKey: ["group", id],
    queryFn: async () => {
      const r = await api.get(`/groups/${id}`);
      return r.data.data;
    },
    enabled: !!id,
  });

  const messagesQuery = useQuery({
    queryKey: ["group-messages", id, group?.isMember],
    queryFn: async () => fetchMessages(null),
    enabled: !!id && !!group?.isMember,
    refetchOnWindowFocus: false,
  });

  // ── Resolve typing names from members list ──
  const typingNames = useMemo<string[]>(() => {
    if (!group?.members || typingUserIds.length === 0) return [];
    return typingUserIds
      .filter((uid) => uid !== user?.id)
      .map((uid) => {
        const m = (group.members as any[]).find((m: any) => m.user.id === uid);
        return m?.user.name ?? "Someone";
      });
  }, [group?.members, typingUserIds, user?.id]);

  // ── Reset on group change ──
  useEffect(() => {
    setRawMessages([]);
    setTypingUserIds([]);
    setHasMore(true);
    setNextCursor(null);
    setIsInitialLoaded(false);
    setUnreadCount(0);
    setIsAtBottom(true);
    isAtBottomRef.current = true;
    pendingRestoreRef.current = null;
    pendingAutoScrollRef.current = null;
  }, [id]);

  // ── Load initial messages ──
  useEffect(() => {
    if (!messagesQuery.data) return;
    const loaded = messagesQuery.data.messages ?? messagesQuery.data.data ?? [];
    setRawMessages(sortChatMessages(loaded));
    setNextCursor(messagesQuery.data.next_cursor ?? null);
    setHasMore(Boolean(messagesQuery.data.has_more ?? loaded.length === PAGE_LIMIT));
    setIsInitialLoaded(true);
    setUnreadCount(0);
    setIsAtBottom(true);
    isAtBottomRef.current = true;
    pendingAutoScrollRef.current = "auto";
  }, [messagesQuery.data]);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "smooth") => {
    window.requestAnimationFrame(() => {
      const container = scrollContainerRef.current?.element;
      if (!container) return;
      container.scrollTo({ top: container.scrollHeight, behavior });
    });
  }, []);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current?.element;
    if (!container) return;

    if (pendingRestoreRef.current) {
      const { scrollHeight, scrollTop } = pendingRestoreRef.current;
      container.scrollTop = container.scrollHeight - scrollHeight + scrollTop;
      pendingRestoreRef.current = null;
      return;
    }

    if (pendingAutoScrollRef.current) {
      const behavior = pendingAutoScrollRef.current;
      pendingAutoScrollRef.current = null;
      scrollToLatest(behavior);
      isAtBottomRef.current = true;
      setIsAtBottom(true);
    }
  }, [rawMessages, scrollToLatest]);

  const loadOlderMessages = useCallback(async () => {
    if (!id || isLoadingOlder || !hasMore || !nextCursor || !group?.isMember) return;
    const container = scrollContainerRef.current?.element;
    if (!container) return;

    setIsLoadingOlder(true);
    try {
      const snapshot = { scrollHeight: container.scrollHeight, scrollTop: container.scrollTop };
      const response = await fetchMessages(nextCursor);
      if (!response) return;
      const older = response.messages ?? response.data ?? [];
      pendingRestoreRef.current = snapshot;
      setRawMessages((current) => mergeChatMessages(current, older));
      setNextCursor(response.next_cursor ?? null);
      setHasMore(Boolean(response.has_more ?? older.length === PAGE_LIMIT));
    } finally {
      setIsLoadingOlder(false);
    }
  }, [fetchMessages, group?.isMember, hasMore, id, isLoadingOlder, nextCursor]);

  const handleScroll = useCallback(
    (scrollOffset: number) => {
      if (scrollDebounceRef.current) window.clearTimeout(scrollDebounceRef.current);
      scrollDebounceRef.current = window.setTimeout(() => {
        const activeContainer = scrollContainerRef.current?.element;
        if (!activeContainer) return;
        const atBottom = scrollContainerIsNearBottom(activeContainer);
        if (atBottom !== isAtBottomRef.current) {
          isAtBottomRef.current = atBottom;
          setIsAtBottom(atBottom);
        }
        if (atBottom) setUnreadCount(0);
        if (scrollOffset <= 0 && hasMore && !isLoadingOlder) void loadOlderMessages();
      }, 80);
    },
    [hasMore, isLoadingOlder, loadOlderMessages]
  );

  const appendIncomingMessage = useCallback((msg: ChatTimelineMessage) => {
    setRawMessages((current) => mergeChatMessages(current, [msg]));
    if (isAtBottomRef.current) pendingAutoScrollRef.current = "smooth";
    else setUnreadCount((c) => c + 1);
  }, []);

  // ── Socket subscriptions ──
  useEffect(() => {
    if (!group?.isMember) return;
    joinGroup(id);
    return () => leaveGroup(id);
  }, [group?.isMember, id, joinGroup, leaveGroup]);

  useEffect(() => {
    return onNewMessage((msg: ChatTimelineMessage) => {
      if (!msg || msg.sender?.id === user?.id || msg.groupId !== id) return;
      appendIncomingMessage(msg);
    });
  }, [appendIncomingMessage, id, onNewMessage, user?.id]);

  useEffect(() => {
    const unsubUpdate = onUpdateMessage((updatedMsg: ChatTimelineMessage) => {
      if (!updatedMsg || updatedMsg.groupId !== id) return;
      setRawMessages((prev) => prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg)));
    });
    const unsubDelete = onDeleteMessage((data: { id: string }) => {
      setRawMessages((prev) => prev.filter((msg) => msg.id !== data.id));
    });
    return () => { unsubUpdate(); unsubDelete(); };
  }, [id, onUpdateMessage, onDeleteMessage]);

  useEffect(() => {
    return onTyping((data) => {
      if (data.groupId !== id) return;
      setTypingUserIds((prev) =>
        data.typing ? [...new Set([...prev, data.userId])] : prev.filter((u) => u !== data.userId)
      );
    });
  }, [id, onTyping]);

  const handleEditMessage = useCallback(async (messageId: string, content: string) => {
    const response = await api.patch(`/groups/messages/${messageId}`, { content });
    const updated = response.data.data;
    setRawMessages((prev) => prev.map((msg) => (msg.id === messageId ? updated : msg)));
  }, []);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    await api.delete(`/groups/messages/${messageId}`);
    setRawMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  const sendMutation = useMutation({
    mutationFn: async (payload: ChatSendPayload & { replyToId?: string }) => {
      const result = await sendMessage(id, payload.content.trim(), {
        imageUrl: payload.imageUrl,
        metadata: payload.metadata,
        replyToId: payload.replyToId,
      });
      if (result?.success === false) throw new Error(result?.error || "Failed to send message");
      return (result?.data ?? result) as ChatTimelineMessage;
    },
  });

  const handleSend = async (payload: ChatSendPayload) => {
    if (!id || isSending) return;
    const content = payload.content.trim();
    if (!content && !payload.imageUrl) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMetadata = {
      ...(payload.metadata || {}),
      ...(replyingTo
        ? {
            replyTo: {
              id: replyingTo.id,
              senderName: replyingTo.sender.name,
              content: replyingTo.content.slice(0, 100) + (replyingTo.content.length > 100 ? "…" : ""),
              imageUrl: replyingTo.imageUrl,
            },
          }
        : {}),
    };

    const optimisticMessage: ChatTimelineMessage = {
      id: tempId,
      content,
      imageUrl: payload.imageUrl,
      metadata: optimisticMetadata as any,
      createdAt: new Date().toISOString(),
      sender: { id: user?.id ?? "me", name: user?.name ?? "You", avatar: user?.avatar ?? undefined },
    };

    const replyToId = replyingTo?.id;
    setReplyingTo(null);
    setIsSending(true);
    stopTyping(id);
    isAtBottomRef.current = true;
    setIsAtBottom(true);
    setRawMessages((current) => mergeChatMessages(current, [optimisticMessage]));
    pendingAutoScrollRef.current = "smooth";

    try {
      const finalMessage = await sendMutation.mutateAsync({ ...payload, replyToId });
      setRawMessages((current) => {
        const withoutTemp = current.filter((item) => item.id !== tempId);
        return mergeChatMessages(withoutTemp, [finalMessage]);
      });
      pendingAutoScrollRef.current = "smooth";
    } catch (error: any) {
      setRawMessages((current) => current.filter((item) => item.id !== tempId));
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const handleReact = useCallback(async (messageId: string, emoji: string) => {
    try {
      const response = await api.post(`/groups/messages/${messageId}/react`, { emoji });
      const updated = response.data.data;
      setRawMessages((prev) => prev.map((msg) => (msg.id === messageId ? updated : msg)));
    } catch {
      toast.error("Failed to react to message");
    }
  }, []);

  const handleReplyClick = useCallback((replyToId: string) => {
    const index = timelineItems.findIndex((item) => item.kind === "message" && item.id === replyToId);
    if (index !== -1) {
      (scrollContainerRef.current as any)?.scrollToRow({ index, align: "center", behavior: "smooth" });
    } else {
      toast.error("Message not found in loaded history");
    }
  }, [timelineItems]);

  const handleTyping = () => {
    if (!id) return;
    startTyping(id);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(id), 2000);
  };

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/groups/${id}/join`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["group", id] }); toast.success("Joined!"); },
    onError: () => toast.error("Failed to join"),
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.post(`/groups/${id}/leave`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["group", id] }); toast.success("Left group"); },
  });

  useEffect(() => {
    if (group?.isMember) queryClient.invalidateQueries({ queryKey: ["group-messages", id, group?.isMember] });
  }, [group?.isMember, id, queryClient]);

  // ── Loading state ──
  if (isLoading || !group) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[var(--color-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent shadow-glow" />
      </div>
    );
  }

  const showEmptyState = isInitialLoaded && rawMessages.length === 0;

  return (
    <div className="mx-auto flex h-[calc(100vh-4.5rem)] max-w-[1400px] flex-col overflow-hidden px-2 py-2 md:px-6 md:py-4">
      <div className="flex flex-1 overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-md">
        {/* ── Main chat column ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <ChatHeader
            groupName={group.name}
            memberCount={group.memberCount}
            isMember={group.isMember}
            isAuthenticated={isAuthenticated}
            onJoin={() => joinMutation.mutate()}
            onLeave={() => leaveMutation.mutate()}
          />

          {!group.isMember ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-[var(--color-bg)] p-8 text-center shadow-inner">
              <Users size={48} className="text-[var(--color-muted)] opacity-40" />
              <div>
                <h3 className="font-display text-xl font-bold tracking-tight">Join the Community</h3>
                <p className="mt-1 max-w-sm text-sm text-[var(--color-muted)]">
                  Become a member of this group to view the entire chat history and start connecting with other artists.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative flex min-h-0 flex-1 flex-col bg-[var(--color-bg)]/30">
              {/* ── Message list ── */}
              <div className="relative min-h-0 flex-1">
                {showEmptyState ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-[var(--color-muted)] opacity-60">
                    <span className="text-3xl">👋</span>
                    <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <VirtualizedChatList
                    items={timelineItems}
                    listRef={scrollContainerRef}
                    loadingOlder={isLoadingOlder}
                    onScroll={handleScroll}
                    itemSize={(item, index) => {
                      if (item.kind === "date-separator") return 36;
                      const meta = getChatRowMeta(timelineItems, index, user?.id);
                      return estimateChatRowHeight(item, meta);
                    }}
                    renderItem={(item, index) => {
                      if (item.kind === "date-separator") {
                        return <DateSeparator key={item.id} label={item.label} />;
                      }
                      const meta = getChatRowMeta(timelineItems, index, user?.id);
                      return (
                        <div key={item.id} className="px-4 md:px-6">
                          <ChatMessage
                            message={item as any}
                            isMe={meta.isMe}
                            showAvatar={meta.showAvatar}
                            showUsername={meta.showUsername}
                            currentUserId={user?.id}
                            onEdit={handleEditMessage}
                            onDelete={handleDeleteMessage}
                            onReply={(msg) => setReplyingTo(msg)}
                            onReplyClick={handleReplyClick}
                            onReact={handleReact}
                          />
                        </div>
                      );
                    }}
                  />
                )}
              </div>

              {/* ── Typing indicator ── */}
              <TypingIndicator names={typingNames} />

              {/* ── Unread messages badge (positioned above input, not hardcoded bottom) ── */}
              {unreadCount > 0 && !isAtBottom && (
                <div className="px-4 pb-1 md:px-6">
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    type="button"
                    onClick={() => {
                      pendingAutoScrollRef.current = "smooth";
                      setUnreadCount(0);
                      isAtBottomRef.current = true;
                      setIsAtBottom(true);
                      scrollToLatest("smooth");
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 py-2 text-xs font-semibold text-[var(--color-accent)] transition hover:bg-[var(--color-accent)]/20"
                    aria-live="polite"
                  >
                    <ArrowDown size={14} />
                    {unreadCount} new message{unreadCount === 1 ? "" : "s"} — scroll to bottom
                  </motion.button>
                </div>
              )}

              {/* ── Chat input ── */}
              <ChatInput
                onSend={handleSend}
                onTyping={handleTyping}
                disabled={!group.isMember || isSending}
                placeholder={group.isMember ? "Message the community…" : "Join the group to chat"}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
              />
            </div>
          )}
        </div>

        {/* ── Members sidebar ── */}
        <ChatSidebar members={group.members} typingUsers={typingUserIds} />
      </div>
    </div>
  );
}
