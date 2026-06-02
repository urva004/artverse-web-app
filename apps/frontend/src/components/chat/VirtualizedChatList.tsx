"use client";

import type { CSSProperties, ReactNode } from "react";
import { List, type ListImperativeAPI, type RowComponentProps } from "react-window";

import type { ChatTimelineMessage } from "@/lib/chat";

interface VirtualizedChatListProps {
  messages: ChatTimelineMessage[];
  listRef: React.RefObject<ListImperativeAPI | null>;
  loadingOlder?: boolean;
  onScroll?: (scrollTop: number) => void;
  itemSize: (message: ChatTimelineMessage, index: number) => number;
  renderItem: (message: ChatTimelineMessage, index: number, style: CSSProperties) => ReactNode;
}

export function VirtualizedChatList({
  messages,
  listRef,
  loadingOlder = false,
  onScroll,
  itemSize,
  renderItem,
}: VirtualizedChatListProps) {
  const Row = ({ index, style, ariaAttributes }: RowComponentProps<{ messages: ChatTimelineMessage[] }>) => {
    const message = messages[index];
    if (!message) {
      return null;
    }

    return (
      <div style={style} {...ariaAttributes}>
        {renderItem(message, index, style)}
      </div>
    );
  };

  return (
    <div className="relative h-full w-full">
      {loadingOlder && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 shadow-lg">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
        </div>
      )}

      <List
        listRef={listRef}
        className="chat-scrollbar"
        style={{ height: "100%", width: "100%" }}
        defaultHeight={600}
        rowCount={messages.length}
        rowHeight={(index) => itemSize(messages[index], index)}
        rowComponent={Row}
        rowProps={{ messages }}
        overscanCount={4}
        onScroll={(event) => onScroll?.((event.currentTarget as HTMLDivElement).scrollTop)}
      />
    </div>
  );
}
