"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowDown, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { ListImperativeAPI } from "react-window";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
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

interface GroupMessagesResponse {
  messages?: ChatTimelineMessage[];
  data?: ChatTimelineMessage[];
  next_cursor?: string | null;
  has_more?: boolean;
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const {
    joinGroup,
    leaveGroup,
    sendMessage,
    onNewMessage,
    startTyping,
    stopTyping,
    onTyping,
  } = useSocket();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatTimelineMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
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
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchMessages = useCallback(
    async (before?: string | null) => {
      if (!id) {
        return null;
      }

      const response = await api.get(`/groups/${id}/messages`, {
        params: {
          before: before || undefined,
          limit: PAGE_LIMIT,
        },
      });

      return response.data as GroupMessagesResponse;
    },
    [id],
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

  useEffect(() => {
    setMessages([]);
    setTypingUsers([]);
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
    if (!messagesQuery.data) {
      return;
    }

    const loadedMessages = messagesQuery.data.messages ?? messagesQuery.data.data ?? [];
    setMessages(sortChatMessages(loadedMessages));
    setNextCursor(messagesQuery.data.next_cursor ?? null);
    setHasMore(Boolean(messagesQuery.data.has_more ?? loadedMessages.length === PAGE_LIMIT));
    setIsInitialLoaded(true);
    setUnreadCount(0);
    setIsAtBottom(true);
    isAtBottomRef.current = true;
    pendingAutoScrollRef.current = "auto";
  }, [messagesQuery.data]);

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
    if (!id || isLoadingOlder || !hasMore || !nextCursor || !group?.isMember) {
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
  }, [fetchMessages, group?.isMember, hasMore, id, isLoadingOlder, nextCursor]);

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
    if (!group?.isMember) {
      return;
    }

    joinGroup(id);
    return () => {
      leaveGroup(id);
    };
  }, [group?.isMember, id, joinGroup, leaveGroup]);

  useEffect(() => {
    const unsub = onNewMessage((msg: ChatTimelineMessage) => {
      if (!msg || msg.sender?.id === user?.id || msg.groupId !== id) {
        return;
      }

      appendIncomingMessage(msg);
    });

    return unsub;
  }, [appendIncomingMessage, id, onNewMessage, user?.id]);

  useEffect(() => {
    const unsub = onTyping((data) => {
      if (data.groupId !== id) {
        return;
      }

      setTypingUsers((prev) =>
        data.typing ? [...new Set([...prev, data.userId])] : prev.filter((u) => u !== data.userId),
      );
    });

    return unsub;
  }, [id, onTyping]);

  const sendMutation = useMutation({
    mutationFn: async (payload: ChatSendPayload) => {
      const result = await sendMessage(id, payload.content.trim(), {
        imageUrl: payload.imageUrl,
        metadata: payload.metadata,
      });

      if (result?.success === false) {
        throw new Error(result?.error || "Failed to send message");
      }

      return (result?.data ?? result) as ChatTimelineMessage;
    },
  });

  const handleSend = async (payload: ChatSendPayload) => {
    if (!id || isSending) {
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

    setIsSending(true);
    stopTyping(id);
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
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    if (!id) {
      return;
    }

    startTyping(id);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(id), 2000);
  };

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/groups/${id}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", id] });
      toast.success("Joined!");
    },
    onError: () => toast.error("Failed to join"),
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.post(`/groups/${id}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", id] });
      toast.success("Left group");
    },
  });

  useEffect(() => {
    if (group?.isMember) {
      queryClient.invalidateQueries({ queryKey: ["group-messages", id, group?.isMember] });
    }
  }, [group?.isMember, id, queryClient]);

  if (isLoading || !group) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[var(--color-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent shadow-glow" />
      </div>
    );
  }

  const showEmptyState = isInitialLoaded && messages.length === 0;

  return (
    <div className="mx-auto flex h-[calc(100vh-4.5rem)] max-w-[1400px] flex-col overflow-hidden px-2 py-2 md:px-6 md:py-4">
      <div className="flex flex-1 overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-md">
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
              <Users size={48} className="text-[var(--color-muted)] opacity-50" />
              <div>
                <h3 className="font-display text-xl font-bold tracking-tight">Join the Community</h3>
                <p className="mt-1 max-w-sm text-sm text-[var(--color-muted)]">
                  Become a member of this group to view the entire chat history and start connecting with other artists.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative flex min-h-0 flex-1 flex-col bg-[var(--color-bg)]/30">
              <div className="relative min-h-0 flex-1">
                {showEmptyState ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-[var(--color-muted)] opacity-70">
                    <p className="text-sm">No messages yet. Start the conversation! 👋</p>
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
                          <div style={style} className="px-4 py-2 md:px-6">
                            <ChatMessage message={item as any} isMe={meta.isMe} showAvatar={meta.showAvatar} />
                          </div>
                        );
                      }}
                    />
                )}
              </div>

              {typingUsers.length > 0 && (
                <div className="px-4 pb-2 text-xs italic text-[var(--color-muted)] md:px-6">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {typingUsers.length === 1 ? "Someone" : "Multiple people"} is typing
                    <span className="animate-pulse">...</span>
                  </motion.span>
                </div>
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
                  className="absolute bottom-20 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-xs font-semibold text-[var(--color-text)] shadow-lg transition hover:border-[var(--color-accent)]"
                >
                  <ArrowDown size={14} />
                  {unreadCount} new message{unreadCount === 1 ? "" : "s"}
                </button>
              )}

              <ChatInput
                message={message}
                setMessage={setMessage}
                onSend={handleSend}
                onTyping={handleTyping}
                disabled={!group.isMember || isSending}
                placeholder={group.isMember ? "Message the community..." : "Join the group to chat"}
              />
            </div>
          )}
        </div>

        <ChatSidebar members={group.members} typingUsers={typingUsers} />
      </div>
    </div>
  );
}
