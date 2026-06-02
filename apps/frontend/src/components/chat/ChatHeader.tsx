import { ArrowLeft, LogIn, LogOut } from "lucide-react";
import Link from "next/link";

interface ChatHeaderProps {
  groupName?: string;
  memberCount?: number;
  isMember?: boolean;
  isAuthenticated: boolean;
  onJoin: () => void;
  onLeave: () => void;
}

export function ChatHeader({
  groupName = "Loading...",
  memberCount = 0,
  isMember,
  isAuthenticated,
  onJoin,
  onLeave,
}: ChatHeaderProps) {
  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-card)]/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <Link
          href="/community"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="font-display text-lg font-bold tracking-tight text-[var(--color-text)]">
            {groupName}
          </h1>
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-teal)] opacity-40"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-teal)]"></span>
            </span>
            {memberCount} Members
          </div>
        </div>
      </div>

      {isAuthenticated &&
        (isMember ? (
          <button
            onClick={onLeave}
            className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-transparent px-4 py-2 text-xs font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-rose)] hover:bg-[var(--color-rose)]/10 hover:text-[var(--color-rose)]"
          >
            <LogOut size={14} />
            Leave
          </button>
        ) : (
          <button
            onClick={onJoin}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-teal)] px-5 py-2 text-xs font-semibold text-white shadow-glow transition hover:shadow-glow-md"
          >
            <LogIn size={14} />
            Join Chat
          </button>
        ))}
    </div>
  );
}
