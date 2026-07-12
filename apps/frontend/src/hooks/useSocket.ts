// ═══════════════════════════════════════════════════
// ArtVerse — Socket.io Client Hook
// ═══════════════════════════════════════════════════

"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:4000";

let socket: Socket | null = null;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    if (!socket) {
      socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket", "polling"], reconnection: true, reconnectionDelay: 1000 });
    }
    socketRef.current = socket;

    return () => {
      // Don't disconnect on unmount — keep alive for app lifetime
    };
  }, []);

  const joinGroup = useCallback((groupId: string) => {
    socketRef.current?.emit("join:group", groupId);
  }, []);

  const leaveGroup = useCallback((groupId: string) => {
    socketRef.current?.emit("leave:group", groupId);
  }, []);

  const sendMessage = useCallback((groupId: string, content: string, options?: { imageUrl?: string; metadata?: any; replyToId?: string }): Promise<any> => {
    return new Promise((resolve) => {
      socketRef.current?.emit("message:send", { groupId, content, ...options }, (response: any) => resolve(response));
    });
  }, []);

  const startTyping = useCallback((groupId: string) => {
    socketRef.current?.emit("typing:start", groupId);
  }, []);

  const stopTyping = useCallback((groupId: string) => {
    socketRef.current?.emit("typing:stop", groupId);
  }, []);

  const onNewMessage = useCallback((callback: (message: any) => void) => {
    socketRef.current?.on("message:new", callback);
    return () => { socketRef.current?.off("message:new", callback); };
  }, []);

  const onUpdateMessage = useCallback((callback: (message: any) => void) => {
    socketRef.current?.on("message:update", callback);
    return () => { socketRef.current?.off("message:update", callback); };
  }, []);

  const onDeleteMessage = useCallback((callback: (data: { id: string }) => void) => {
    socketRef.current?.on("message:delete", callback);
    return () => { socketRef.current?.off("message:delete", callback); };
  }, []);

  const onDirectMessage = useCallback((callback: (message: any) => void) => {
    socketRef.current?.on("direct:message:new", callback);
    return () => { socketRef.current?.off("direct:message:new", callback); };
  }, []);

  const onUpdateDirectMessage = useCallback((callback: (message: any) => void) => {
    socketRef.current?.on("direct:message:update", callback);
    return () => { socketRef.current?.off("direct:message:update", callback); };
  }, []);

  const onDeleteDirectMessage = useCallback((callback: (data: { id: string }) => void) => {
    socketRef.current?.on("direct:message:delete", callback);
    return () => { socketRef.current?.off("direct:message:delete", callback); };
  }, []);

  const onTyping = useCallback((callback: (data: { userId: string; groupId: string; typing: boolean }) => void) => {
    socketRef.current?.on("typing:user", callback);
    return () => { socketRef.current?.off("typing:user", callback); };
  }, []);

  return {
    socket: socketRef.current,
    joinGroup,
    leaveGroup,
    sendMessage,
    startTyping,
    stopTyping,
    onNewMessage,
    onUpdateMessage,
    onDeleteMessage,
    onDirectMessage,
    onUpdateDirectMessage,
    onDeleteDirectMessage,
    onTyping,
  };
}
