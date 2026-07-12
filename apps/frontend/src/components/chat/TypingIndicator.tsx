"use client";

import { motion, AnimatePresence } from "framer-motion";

interface TypingIndicatorProps {
  names: string[];
}

export function TypingIndicator({ names }: TypingIndicatorProps) {
  if (names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <AnimatePresence>
      <motion.div
        key="typing-indicator"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2 px-4 pb-1 md:px-6"
        aria-live="polite"
        aria-label={label}
      >
        {/* Animated dot bubble */}
        <div className="flex h-7 items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 shadow-sm">
          <span className="animate-bounce-dot [animation-delay:0ms] h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]" />
          <span className="animate-bounce-dot [animation-delay:160ms] h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]" />
          <span className="animate-bounce-dot [animation-delay:320ms] h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]" />
        </div>
        <span className="text-[11px] text-[var(--color-muted)]">{label}…</span>
      </motion.div>
    </AnimatePresence>
  );
}
