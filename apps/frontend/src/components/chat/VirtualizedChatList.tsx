"use client";

import { type CSSProperties, type ReactNode } from "react";
import { List, type ListImperativeAPI, type RowComponentProps } from "react-window";

import type { ChatTimelineItem } from "@/lib/chat";

interface VirtualizedChatListProps {
  items: ChatTimelineItem[];
  listRef: React.RefObject<ListImperativeAPI | null>;
  loadingOlder?: boolean;
  onScroll?: (scrollTop: number) => void;
  itemSize: (item: ChatTimelineItem, index: number) => number;
  renderItem: (item: ChatTimelineItem, index: number, style: CSSProperties) => ReactNode;
}

export function VirtualizedChatList({
  items,
  listRef,
  loadingOlder = false,
  onScroll,
  itemSize,
  renderItem,
}: VirtualizedChatListProps) {
  // Stable key: use item count + last item's id (not a full timestamp sum)
  const lastItem = items[items.length - 1];
  const listKey = `${items.length}-${lastItem?.id ?? "empty"}`;

  const Row = ({ index, style, ariaAttributes }: RowComponentProps<{ items: ChatTimelineItem[] }>) => {
    const item = items[index];
    if (!item) return null;

    return (
      <div style={style} {...ariaAttributes}>
        {renderItem(item, index, {})}
      </div>
    );
  };

  return (
    <div className="relative h-full w-full">
      {/* "Loading older messages" spinner */}
      {loadingOlder && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-1.5 shadow-lg">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
          <span className="text-[11px] text-[var(--color-muted)]">Loading older messages</span>
        </div>
      )}

      <List
        key={listKey}
        listRef={listRef as any}
        className="chat-scrollbar"
        style={{ height: "100%", width: "100%" }}
        defaultHeight={600}
        rowCount={items.length}
        rowHeight={(index) => itemSize(items[index]!, index)}
        rowComponent={Row}
        rowProps={{ items }}
        overscanCount={5}
        onScroll={(event) => onScroll?.((event.currentTarget as HTMLDivElement).scrollTop)}
      />
    </div>
  );
}
