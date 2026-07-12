// ═══════════════════════════════════════════════════
// ArtVerse — ChatSidebar (Members Panel)
// ═══════════════════════════════════════════════════

import { UserAvatar } from "@/components/UserAvatar";
import Link from "next/link";
import { useMemo } from "react";

interface Member {
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface ChatSidebarProps {
  members?: Member[];
  typingUsers: string[]; // array of user IDs currently typing
}

export function ChatSidebar({ members = [], typingUsers }: ChatSidebarProps) {
  // Sort: admins first, then typing (active) users, then alphabetically
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.role === "ADMIN" && b.role !== "ADMIN") return -1;
      if (b.role === "ADMIN" && a.role !== "ADMIN") return 1;
      const aTyping = typingUsers.includes(a.user.id) ? 0 : 1;
      const bTyping = typingUsers.includes(b.user.id) ? 0 : 1;
      if (aTyping !== bTyping) return aTyping - bTyping;
      return a.user.name.localeCompare(b.user.name);
    });
  }, [members, typingUsers]);

  return (
    <div className="hidden w-60 shrink-0 flex-col overflow-hidden border-l border-[var(--color-border)] bg-[var(--color-card)]/50 lg:flex">
      <div className="px-4 py-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
          Members — {members.length}
        </h3>
      </div>

      <div className="chat-scrollbar flex-1 overflow-y-auto space-y-0.5 px-2 pb-4">
        {sortedMembers.map((m) => {
          const isTyping = typingUsers.includes(m.user.id);

          return (
            <Link
              key={m.userId}
              href={`/artists/${m.user.id}`}
              className="group flex items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-[var(--color-bg)]"
            >
              {/* Avatar with real status indicator */}
              <div className="relative h-8 w-8 shrink-0">
                <UserAvatar
                  name={m.user.name}
                  avatar={m.user.avatar ?? null}
                  className={`h-8 w-8 transition duration-300 ${!isTyping ? "opacity-70" : ""}`}
                  textClassName="text-[10px] font-semibold"
                />
                {/* Status dot — only shown when truly typing */}
                <span
                  aria-label={isTyping ? "Currently typing" : "Member"}
                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-card)] transition group-hover:border-[var(--color-bg)] ${
                    isTyping ? "bg-[var(--color-accent)] animate-pulse" : "bg-[var(--color-border)]"
                  }`}
                />
              </div>

              {/* Name + role/status */}
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[12px] font-medium ${isTyping ? "text-[var(--color-text)]" : "text-[var(--color-muted)]"}`}>
                  {m.user.name}
                </p>
                <p className="truncate text-[10px] text-[var(--color-muted)]">
                  {isTyping ? (
                    <span className="text-[var(--color-accent)]">typing…</span>
                  ) : (
                    m.role.charAt(0) + m.role.slice(1).toLowerCase()
                  )}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
