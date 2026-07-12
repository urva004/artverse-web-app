"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { formatRelativeTime } from "@artverse/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const r = await api.get("/notifications");
      return r.data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.put("/notifications/read-all"),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!isAuthenticated) return null;

  const notifications = data?.data ?? [];
  const unread = data?.unreadCount ?? 0;

  return (
    <div ref={ref} className="md:relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-input text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-rose)] text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-4 right-4 md:left-auto md:right-0 top-12 z-modal md:w-80 overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] p-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                className="flex items-center gap-1 text-[11px] text-[var(--color-accent)] hover:underline"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-[var(--color-muted)]">
                No notifications yet
              </p>
            ) : (
              notifications.slice(0, 10).map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markOneMutation.mutate(n.id);
                    setOpen(false);
                  }}
                  className={`flex cursor-pointer gap-3 border-b border-[var(--color-border)] p-3 transition hover:bg-[var(--color-bg)] ${!n.isRead ? "bg-[var(--color-accent)]/5" : ""}`}
                >
                  <div
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-transparent" : "bg-[var(--color-accent)]"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--color-muted)]">
                      {n.message}
                    </p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="text-[10px] text-[var(--color-muted)]">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => {
                              if (!n.isRead) markOneMutation.mutate(n.id);
                              setOpen(false);
                            }}
                            className="text-[10px] font-semibold text-[var(--color-accent)] hover:underline"
                          >
                            Open
                          </Link>
                        )}
                      </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
