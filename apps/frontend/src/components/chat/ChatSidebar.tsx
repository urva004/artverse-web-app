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
  typingUsers: string[];
}

export function ChatSidebar({ members = [], typingUsers }: ChatSidebarProps) {
  // Sort admins first, then online/typing artificially, then others.
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.role === "ADMIN" && b.role !== "ADMIN") return -1;
      if (b.role === "ADMIN" && a.role !== "ADMIN") return 1;
      return a.user.name.localeCompare(b.user.name);
    });
  }, [members]);

  return (
    <div className="hidden w-64 shrink-0 flex-col overflow-hidden border-l border-[var(--color-border)] bg-[var(--color-card)]/50 lg:flex">
      <div className="p-4 pb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
          Members — {members.length}
        </h3>
      </div>
      <div className="chat-scrollbar flex-1 overflow-y-auto space-y-0.5 px-2 pb-4 pr-3">
        {sortedMembers.map((m) => {
          const isTyping = typingUsers.includes(m.user.id);
          // Hardcoding some artificial status logic for pure UI visual representation.
          // Using math/random string seeded online states just to show UX.
          const isOnline = isTyping || m.user.name.length % 2 === 0;

          return (
            <Link
              key={m.userId}
              href={`/artists/${m.user.id}`}
              className="group flex items-center gap-3 rounded-md px-2 py-1.5 transition hover:bg-[var(--color-bg)]"
            >
              <div className="relative h-8 w-8 shrink-0">
                <UserAvatar
                  name={m.user.name}
                  avatar={m.user.avatar ?? null}
                  className={`h-8 w-8 transition duration-300 ${!isOnline ? "opacity-60 saturate-50" : ""}`}
                  textClassName="text-[10px] font-semibold"
                />

                {/* Status Indicator Badge */}
                <div
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--color-card)] transition group-hover:border-[var(--color-bg)] ${
                    isTyping
                      ? "bg-[var(--color-accent)]"
                      : isOnline
                        ? "bg-emerald-500"
                        : "bg-gray-400"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-[13px] font-medium ${
                    !isOnline ? "text-[var(--color-muted)]" : "text-[var(--color-text)]"
                  }`}
                >
                  {m.user.name}
                </p>
                <p className="truncate text-[10px] text-[var(--color-muted)]">
                  {isTyping ? "typing..." : m.role}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
