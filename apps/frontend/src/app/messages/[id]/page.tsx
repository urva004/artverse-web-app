"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ListImperativeAPI } from "react-window";

import { UserAvatar } from "@/components/UserAvatar";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { VirtualizedChatList } from "@/components/chat/VirtualizedChatList";
import type { ChatSendPayload } from "@/components/chat/types";
import { api } from "@/lib/api";
import {
  estimateChatRowHeight,
  getChatRowMeta,
  mergeChatMessages,
  scrollContainerIsNearBottom,
  sortChatMessages,
  type ChatTimelineMessage,
} from "@/lib/chat";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";

const PAGE_LIMIT = 20;

interface DirectMessageThreadResponse {
  messages?: ChatTimelineMessage[];
  data?: ChatTimelineMessage[];
  next_cursor?: string | null;
  has_more?: boolean;
  recipient?: {
    id: string;
    name: string;
    avatar?: string | null;
    role?: string;
  };
}

export default function DirectMessagePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { onDirectMessage } = useSocket();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatTimelineMessage[]>([]);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isInitialLoaded, setIsInitialLoaded] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollContainerRef = useRef<ListImperativeAPI | null>(null);
  const pendingRestoreRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const pendingAutoScrollRef = useRef<ScrollBehavior | null>(null);
  const isAtBottomRef = useRef(true);
  const scrollDebounceRef = useRef<number | null>(null);

  const fetchMessages = useCallback(
    async (before?: string | null) => {
      if (!id) {
        return null;
      }

      const response = await api.get(`/users/${id}/messages`, {
        params: {
          before: before || undefined,
          limit: PAGE_LIMIT,
        },
      });

      return response.data as DirectMessageThreadResponse;
    },
    [id],
  );

  const initialMessagesQuery = useQuery({
    queryKey: ["direct-messages", id],
    queryFn: async () => fetchMessages(null),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  const recipientQuery = useQuery({
    queryKey: ["direct-message-user", id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}`);
      return response.data.data as {
        id: string;
        name: string;
        avatar?: string | null;
        role?: string;
      };
    },
    enabled: !!id,
  });

  useEffect(() => {
    setMessages([]);
    setHasMore(true);
    setNextCursor(null);
    setIsInitialLoaded(false);
    setUnreadCount(0);
    setIsAtBottom(true);
    isAtBottomRef.current = true;
    pendingRestoreRef.current = null;
    pendingAutoScrollRef.current = null;
  }, [id]);

  useEffect(() => {
    if (!initialMessagesQuery.data) {
      return;
    }

    const loadedMessages = initialMessagesQuery.data.messages ?? initialMessagesQuery.data.data ?? [];
    setMessages(sortChatMessages(loadedMessages));
    setNextCursor(initialMessagesQuery.data.next_cursor ?? null);
    setHasMore(Boolean(initialMessagesQuery.data.has_more ?? loadedMessages.length === PAGE_LIMIT));
    setIsInitialLoaded(true);
    setUnreadCount(0);
    setIsAtBottom(true);
    isAtBottomRef.current = true;
    pendingAutoScrollRef.current = "auto";
  }, [initialMessagesQuery.data]);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = scrollContainerRef.current?.element;
    if (!container) {
      return;
    }

    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current?.element;
    if (!container) {
      return;
    }

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
  }, [messages, scrollToLatest]);

  const loadOlderMessages = useCallback(async () => {
    if (!id || isLoadingOlder || !hasMore || !nextCursor) {
      return;
    }

    const container = scrollContainerRef.current?.element;
    if (!container) {
      return;
    }

    setIsLoadingOlder(true);

    try {
      const snapshot = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop,
      };

      const response = await fetchMessages(nextCursor);
      if (!response) {
        return;
      }

      const olderMessages = response.messages ?? response.data ?? [];
      pendingRestoreRef.current = snapshot;
      setMessages((current) => mergeChatMessages(current, olderMessages));
      setNextCursor(response.next_cursor ?? null);
      setHasMore(Boolean(response.has_more ?? olderMessages.length === PAGE_LIMIT));
    } finally {
      setIsLoadingOlder(false);
    }
  }, [fetchMessages, hasMore, id, isLoadingOlder, nextCursor]);

  const handleScroll = useCallback(
    (scrollOffset: number) => {
      const container = scrollContainerRef.current;
      if (!container) {
        return;
      }

      if (scrollDebounceRef.current) {
        window.clearTimeout(scrollDebounceRef.current);
      }

      scrollDebounceRef.current = window.setTimeout(() => {
        const activeContainer = scrollContainerRef.current?.element;
        if (!activeContainer) {
          return;
        }

        const atBottom = scrollContainerIsNearBottom(activeContainer);
        if (atBottom !== isAtBottomRef.current) {
          isAtBottomRef.current = atBottom;
          setIsAtBottom(atBottom);
        }

        if (atBottom) {
          setUnreadCount(0);
        }

        if (scrollOffset <= 0 && hasMore && !isLoadingOlder) {
          void loadOlderMessages();
        }
      }, 80);
    },
    [hasMore, isLoadingOlder, loadOlderMessages],
  );

  const appendIncomingMessage = useCallback((incomingMessage: ChatTimelineMessage) => {
    setMessages((current) => mergeChatMessages(current, [incomingMessage]));

    if (isAtBottomRef.current) {
      pendingAutoScrollRef.current = "smooth";
    } else {
      setUnreadCount((count) => count + 1);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onDirectMessage((incomingMessage: ChatTimelineMessage) => {
      if (!incomingMessage || (incomingMessage.sender?.id !== id && incomingMessage.recipient?.id !== id)) {
        return;
      }

      if (incomingMessage.sender?.id === user?.id) {
        return;
      }

      appendIncomingMessage(incomingMessage);
    });

    return unsubscribe;
  }, [appendIncomingMessage, id, onDirectMessage, user?.id]);

  const sendMutation = useMutation({
    mutationFn: async (payload: ChatSendPayload) => {
      const response = await api.post(`/users/${id}/messages`, payload);
      return response.data.data as ChatTimelineMessage;
    },
  });

  const handleSend = async (payload: ChatSendPayload) => {
    if (sendMutation.isPending) {
      return;
    }

    const content = payload.content.trim();
    if (!content && !payload.imageUrl) {
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatTimelineMessage = {
      id: tempId,
      content,
      imageUrl: payload.imageUrl,
      metadata: (payload.metadata ?? null) as Record<string, unknown> | null,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id ?? "me",
        name: user?.name ?? "You",
        avatar: user?.avatar ?? null,
      },
    };

    isAtBottomRef.current = true;
    setIsAtBottom(true);
    setMessages((current) => mergeChatMessages(current, [optimisticMessage]));
    pendingAutoScrollRef.current = "smooth";

    try {
      const finalMessage = await sendMutation.mutateAsync(payload);
      setMessages((current) => {
        const withoutTemp = current.filter((item) => item.id !== tempId);
        return mergeChatMessages(withoutTemp, [finalMessage]);
      });
      pendingAutoScrollRef.current = "smooth";
    } catch (error: any) {
      setMessages((current) => current.filter((item) => item.id !== tempId));
      throw error;
    }
  };

  if (initialMessagesQuery.isLoading && !isInitialLoaded) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[var(--color-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (initialMessagesQuery.isError) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 px-4 text-center">
        <MessageSquare size={40} className="text-[var(--color-muted)]" />
        <h1 className="font-display text-2xl">Conversation not available</h1>
        <Link href="/marketplace" className="rounded-pill bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white">
          Back to marketplace
        </Link>
      </div>
    );
  }

  const recipient = recipientQuery.data;
  const showEmptyState = isInitialLoaded && messages.length === 0;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <Link
              href={`/artists/${id}`}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              aria-label="Back to profile"
            >
              <ArrowLeft size={18} />
            </Link>
            <UserAvatar name={recipient?.name || "User"} avatar={recipient?.avatar ?? null} className="h-11 w-11" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">{recipient?.name || "Conversation"}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {recipient?.role === "SELLER" ? "Seller" : recipient?.role === "ADMIN" ? "Admin" : "Buyer"}
              </p>
            </div>
          </div>
          <span className="hidden rounded-pill border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-muted)] sm:inline-flex">
            Direct chat
          </span>
        </div>

        <div className="relative min-h-0 flex-1 bg-[var(--color-bg)]/40">
          {showEmptyState ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 px-4 text-center text-[var(--color-muted)]">
              <MessageSquare size={40} />
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">No messages yet</p>
                <p className="mt-1 text-sm">Start the conversation or share an artwork here.</p>
              </div>
            </div>
          ) : (
            <VirtualizedChatList
              messages={messages}
              listRef={scrollContainerRef}
              loadingOlder={isLoadingOlder}
              onScroll={handleScroll}
              itemSize={(item, index) => {
                const meta = getChatRowMeta(messages, index, user?.id);
                return estimateChatRowHeight(item, meta.showAvatar);
              }}
              renderItem={(item, index, style) => {
                const meta = getChatRowMeta(messages, index, user?.id);

                return (
                  <div style={style} className="px-4 py-2 sm:px-6">
                    <ChatMessage message={item as any} isMe={meta.isMe} showAvatar={meta.showAvatar} />
                  </div>
                );
              }}
            />
          )}

          {unreadCount > 0 && !isAtBottom && (
            <button
              type="button"
              onClick={() => {
                pendingAutoScrollRef.current = "smooth";
                setUnreadCount(0);
                isAtBottomRef.current = true;
                setIsAtBottom(true);
                scrollToLatest("smooth");
              }}
              className="absolute bottom-4 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-xs font-semibold text-[var(--color-text)] shadow-lg transition hover:border-[var(--color-accent)]"
            >
              <ArrowDown size={14} />
              {unreadCount} new message{unreadCount === 1 ? "" : "s"}
            </button>
          )}
        </div>

        <ChatInput
          message={message}
          setMessage={setMessage}
          onSend={handleSend}
          onTyping={() => undefined}
          placeholder={`Message ${recipient?.name || "user"}`}
          disabled={sendMutation.isPending}
        />
      </div>
    </div>
  );
}
