// ═══════════════════════════════════════════════════
// ArtVerse — ChatMessage (Portal Context Menu)
// ═══════════════════════════════════════════════════

"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  useMemo,
} from "react";
import toast from "react-hot-toast";
import {
  X,
  Copy,
  Trash2,
  Edit3,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  Smile,
  Reply,
  MoreVertical,
  Flag,
} from "lucide-react";
import { formatPrice, formatRelativeTime } from "@artverse/utils";
import { UserAvatar } from "@/components/UserAvatar";
import { SafeImage } from "@/components/SafeImage";
import { normalizeImageSrc } from "@/lib/image";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface SharedArtworkCard {
  id: string;
  title: string;
  imageUrl: string;
  shareUrl: string;
  price?: number;
  sellerName?: string;
}

export interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    createdAt: string | Date;
    updatedAt?: string | Date;
    imageUrl?: string | null;
    metadata?: {
      artwork?: SharedArtworkCard;
      replyTo?: {
        id: string;
        senderName: string;
        content: string;
        imageUrl?: string | null;
      };
      reactions?: Array<{ emoji: string; userIds: string[] }>;
    } | null;
    sender: { id: string; name: string; avatar?: string };
  };
  isMe: boolean;
  showAvatar: boolean;
  showUsername: boolean;
  currentUserId?: string;
  onEdit?: (messageId: string, content: string) => Promise<void>;
  onDelete?: (messageId: string) => Promise<void>;
  onReply?: (message: any) => void;
  onReplyClick?: (replyToId: string) => void;
  onReact?: (messageId: string, emoji: string) => Promise<void>;
}

// ─────────────────────────────────────────────────
// Viewport-aware menu placement
// ─────────────────────────────────────────────────

const MENU_W = 208;  // px — matches w-52
const MENU_H = 360;  // px — estimated max height
const MARGIN = 8;    // keep this many px from viewport edge

interface MenuCoords {
  x: number;
  y: number;
  openUpward: boolean;
}

/**
 * Given a trigger element's DOMRect, compute the best
 * fixed-position coordinates for the floating menu so it
 * never leaves the viewport.
 */
function computeMenuPlacement(triggerRect: DOMRect): MenuCoords {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Horizontal: prefer opening to the left of trigger (align right edge of menu to trigger)
  let x = triggerRect.right - MENU_W;
  if (x < MARGIN) x = MARGIN;
  if (x + MENU_W > vw - MARGIN) x = vw - MENU_W - MARGIN;

  // Vertical: open downward by default, switch to upward if not enough room below
  const spaceBelow = vh - triggerRect.bottom;
  const openUpward = spaceBelow < MENU_H && triggerRect.top > MENU_H;
  const y = openUpward
    ? Math.max(MARGIN, triggerRect.top - MENU_H)
    : Math.min(triggerRect.bottom + 4, vh - MENU_H - MARGIN);

  return { x, y, openUpward };
}

/**
 * Given a raw clientX/Y (right-click), compute smart placement.
 */
function computeMenuPlacementFromPoint(cx: number, cy: number): MenuCoords {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const openUpward = cy + MENU_H > vh - MARGIN;
  let x = cx;
  if (x + MENU_W > vw - MARGIN) x = vw - MENU_W - MARGIN;
  if (x < MARGIN) x = MARGIN;
  const y = openUpward
    ? Math.max(MARGIN, cy - MENU_H)
    : Math.min(cy, vh - MENU_H - MARGIN);

  return { x, y, openUpward };
}

// ─────────────────────────────────────────────────
// Portal wrapper (renders children into document.body)
// ─────────────────────────────────────────────────

function BodyPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ─────────────────────────────────────────────────
// Floating Hover Action Bar
// ─────────────────────────────────────────────────

interface HoverActionBarProps {
  isMe: boolean;
  hasText: boolean;
  onReact: () => void;
  onReply: () => void;
  onCopy: () => void;
  onMore: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

function HoverActionBar({ isMe, hasText, onReact, onReply, onCopy, onMore }: HoverActionBarProps) {
  const btn =
    "flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-muted)] transition-all duration-150 hover:bg-[var(--color-bg-2)] hover:text-[var(--color-text)] hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      // Floats ABOVE the bubble — absolute, -top-8, zero layout impact
      className={`pointer-events-auto absolute -top-8 ${
        isMe ? "right-0" : "left-0"
      } z-20 flex items-center gap-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-1 py-0.5 shadow-lg`}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {!isMe && (
        <button type="button" onClick={onReact} className={btn} aria-label="Add emoji reaction" title="React">
          <Smile size={14} />
        </button>
      )}
      <button type="button" onClick={onReply} className={btn} aria-label="Reply to message" title="Reply">
        <Reply size={14} />
      </button>
      {hasText && (
        <button type="button" onClick={onCopy} className={btn} aria-label="Copy message text" title="Copy">
          <Copy size={14} />
        </button>
      )}
      <button
        type="button"
        onClick={onMore}
        className={btn}
        aria-label="More options"
        aria-haspopup="menu"
        title="More"
      >
        <MoreVertical size={14} />
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────
// Portal-rendered Context Menu
// ─────────────────────────────────────────────────

interface ContextMenuState {
  x: number;
  y: number;
  openUpward: boolean;
}

interface ContextMenuProps {
  coords: ContextMenuState;
  isMe: boolean;
  hasText: boolean;
  hasImage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReply: () => void;
  onCopyText: () => void;
  onCopyImage: () => void;
  onReact: (emoji: string) => void;
  onOpenReactionPicker: () => void;
}

function ContextMenu({
  coords,
  isMe,
  hasText,
  hasImage,
  onClose,
  onEdit,
  onDelete,
  onReply,
  onCopyText,
  onCopyImage,
  onReact,
  onOpenReactionPicker,
}: ContextMenuProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const ownItems = [
    { icon: <Reply size={14} />, label: "Reply", action: onReply },
    ...(hasText ? [{ icon: <Copy size={14} />, label: "Copy Text", action: onCopyText }] : []),
    ...(hasImage ? [{ icon: <Copy size={14} />, label: "Copy Image", action: onCopyImage }] : []),
    ...(!hasImage ? [{ icon: <Edit3 size={14} />, label: "Edit Message", action: onEdit }] : []),
    { icon: <Trash2 size={14} />, label: "Delete Message", action: onDelete, danger: true },
  ];

  const otherItems = [
    { icon: <Reply size={14} />, label: "Reply", action: onReply },
    ...(hasText ? [{ icon: <Copy size={14} />, label: "Copy Text", action: onCopyText }] : []),
    ...(hasImage ? [{ icon: <Copy size={14} />, label: "Copy Image", action: onCopyImage }] : []),
    { icon: <Flag size={14} />, label: "Report", action: () => { toast("Report sent", { icon: "🚩" }); onClose(); }, danger: true },
  ];

  const items = isMe ? ownItems : otherItems;

  // Single motion.div root — no fragment so AnimatePresence tracks it cleanly
  return (
    <motion.div
      role="menu"
      aria-label="Message options"
      initial={{ opacity: 0, scale: 0.92, y: coords.openUpward ? 8 : -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: coords.openUpward ? 8 : -8 }}
      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed",
        top: coords.y,
        left: coords.x,
        width: MENU_W,
        zIndex: 99999,
      }}
      className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] py-1 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Quick emoji strip */}
      <div className="flex items-center justify-around border-b border-[var(--color-border)] px-2 py-2 gap-0.5">
        {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
          <button
            key={emoji}
            role="menuitem"
            onClick={() => onReact(emoji)}
            className="rounded-lg p-1.5 text-base transition-transform hover:scale-125 hover:bg-[var(--color-bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
        <button
          role="menuitem"
          onClick={onOpenReactionPicker}
          className="rounded-lg p-1.5 text-xs font-bold text-[var(--color-muted)] transition hover:bg-[var(--color-bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          aria-label="Open full emoji picker"
        >
          ＋
        </button>
      </div>

      {/* Action list */}
      <div className="py-0.5">
        {items.map((item) => (
          <button
            key={item.label}
            role="menuitem"
            onClick={item.action}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-[var(--color-bg)] focus:bg-[var(--color-bg)] focus:outline-none ${
              (item as any).danger ? "text-[var(--color-rose)]" : "text-[var(--color-text)]"
            }`}
            aria-label={item.label}
          >
            <span className={(item as any).danger ? "text-[var(--color-rose)]" : "text-[var(--color-muted)]"}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────

function ChatMessageComponent({
  message,
  isMe,
  showAvatar,
  showUsername,
  currentUserId,
  onEdit,
  onDelete,
  onReply,
  onReplyClick,
  onReact,
}: ChatMessageProps) {
  // ── UI state ──────────────────────────────────
  const [isHovered, setIsHovered] = useState(false);
  const [menuCoords, setMenuCoords] = useState<ContextMenuState | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQuickReact, setShowQuickReact] = useState(false);
  const [showFullReactionPicker, setShowFullReactionPicker] = useState(false);
  const [showAvatarTooltip, setShowAvatarTooltip] = useState(false);

  // ── Refs ──────────────────────────────────────
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const quickReactRef = useRef<HTMLDivElement>(null);
  const fullPickerRef = useRef<HTMLDivElement>(null);
  // Used to measure the bubble for touch-context-menu positioning
  const bubbleRef = useRef<HTMLDivElement>(null);

  // ── Derived values ─────────────────────────────
  const sharedArtwork = message.metadata?.artwork;
  const isEdited = message.updatedAt
    ? new Date(message.updatedAt).getTime() > new Date(message.createdAt).getTime() + 1_000
    : false;
  const showTail = showAvatar && !isMe;
  const hasText = Boolean(message.content?.trim());
  const hasImage = Boolean(message.imageUrl);

  // ── Auto-grow edit textarea ────────────────────
  useEffect(() => {
    if (!isEditing || !editTextareaRef.current) return;
    const el = editTextareaRef.current;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [isEditing, editContent]);

  // ── Close quick-react on outside click ─────────
  useEffect(() => {
    if (!showQuickReact) return;
    const close = (e: MouseEvent) => {
      if (quickReactRef.current && !quickReactRef.current.contains(e.target as Node)) {
        setShowQuickReact(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showQuickReact]);

  // ── Close full-picker on outside click ─────────
  useEffect(() => {
    if (!showFullReactionPicker) return;
    const close = (e: MouseEvent) => {
      if (fullPickerRef.current && !fullPickerRef.current.contains(e.target as Node)) {
        setShowFullReactionPicker(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showFullReactionPicker]);

  // ── Right-click → Portal context menu ─────────
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const coords = computeMenuPlacementFromPoint(e.clientX, e.clientY);
    setMenuCoords(coords);
    setShowQuickReact(false);
    setShowFullReactionPicker(false);
  }, []);

  // ── Long-press (mobile) → Portal context menu ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 1) return;
    const touch = e.touches[0];
    if (!touch) return;
    touchTimerRef.current = setTimeout(() => {
      // Use the bubble element's rect for smart placement on mobile
      const rect = bubbleRef.current?.getBoundingClientRect() ?? {
        right: touch.clientX, bottom: touch.clientY,
        top: touch.clientY, left: touch.clientX,
      } as DOMRect;
      setMenuCoords(computeMenuPlacement(rect as DOMRect));
    }, 600);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  }, []);

  // ── "More ⋮" from hover bar → Portal context menu ─
  const handleMoreClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    // Open below the button, smart repositioning if needed
    setMenuCoords(computeMenuPlacement(rect));
    setShowQuickReact(false);
    setShowFullReactionPicker(false);
    setIsHovered(false);
  }, []);

  const closeMenu = useCallback(() => setMenuCoords(null), []);

  // ── Edit handlers ──────────────────────────────
  const handleEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) { toast.error("Message cannot be empty"); return; }
    if (trimmed === message.content) { setIsEditing(false); return; }
    try {
      await onEdit?.(message.id, trimmed);
      setIsEditing(false);
    } catch {
      toast.error("Failed to edit message");
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEdit(); }
    else if (e.key === "Escape") { setIsEditing(false); setEditContent(message.content); }
  };

  // ── Delete ─────────────────────────────────────
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete?.(message.id);
    } catch {
      toast.error("Failed to delete message");
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  // ── Copy text ──────────────────────────────────
  const handleCopyText = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    toast.success("Message copied");
    closeMenu();
  }, [message.content, closeMenu]);

  // ── Copy image ─────────────────────────────────
  const handleCopyImage = useCallback(async () => {
    if (!message.imageUrl) return;
    closeMenu();
    try {
      const res = await fetch(normalizeImageSrc(message.imageUrl));
      const blob = await res.blob();
      if (blob.type === "image/png") {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        toast.success("Image copied"); return;
      }
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = normalizeImageSrc(message.imageUrl);
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; });
      const canvas = document.createElement("canvas");
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      canvas.toBlob(async (pngBlob) => {
        if (pngBlob) {
          await navigator.clipboard.write([new ClipboardItem({ [pngBlob.type]: pngBlob })]);
          toast.success("Image copied");
        }
      }, "image/png");
    } catch {
      toast.error("Failed to copy image");
    }
  }, [message.imageUrl, closeMenu]);

  // ── Lightbox wheel-zoom ─────────────────────────
  const handleLightboxWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setLightboxZoom((z) => Math.min(4, Math.max(0.5, z - e.deltaY * 0.002)));
  }, []);

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <>
      {/* ══ Message row ══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.15 }}
        className={`group relative flex w-full gap-2 ${isMe ? "flex-row-reverse" : "flex-row"} ${
          showUsername ? "mt-4" : "mt-0.5"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowQuickReact(false); }}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
      >
        {/* ── Avatar column ────────────────────────── */}
        <div className="flex w-8 shrink-0 flex-col items-center justify-end">
          {showAvatar ? (
            <div
              className="relative"
              onMouseEnter={() => setShowAvatarTooltip(true)}
              onMouseLeave={() => setShowAvatarTooltip(false)}
            >
              <UserAvatar
                name={message.sender.name}
                avatar={message.sender.avatar ?? null}
                className="h-8 w-8 cursor-pointer border border-[var(--color-border)] shadow-sm"
                textClassName="text-[10px] font-semibold"
              />
              <AnimatePresence>
                {showAvatarTooltip && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.12 }}
                    className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text)] shadow-xl"
                  >
                    {message.sender.name}
                    <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--color-card)]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <span className="hidden text-[9px] tabular-nums text-[var(--color-muted)] opacity-0 transition-opacity group-hover:opacity-100 lg:block">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        {/* ── Bubble column ─────────────────────────── */}
        <div
          className={`flex max-w-[85%] sm:max-w-[70%] lg:max-w-[60%] flex-col ${
            isMe ? "items-end" : "items-start"
          }`}
        >
          {/* Username header */}
          {showUsername && (
            <div className="mb-1 flex items-baseline gap-2 pl-1.5">
              <span className="text-[12px] font-bold text-[var(--color-text)]">
                {message.sender.name}
              </span>
              <span className="text-[9px] font-medium text-[var(--color-muted)]">
                {formatRelativeTime(new Date(message.createdAt).toISOString())}
              </span>
            </div>
          )}

          {/*
            Bubble wrapper: position:relative so the hover bar can be
            position:absolute -top-8 without expanding this container.
            overflow:visible is the DEFAULT for non-scroll elements, so the
            absolute hover bar will naturally overflow upward — no clipping.
          */}
          <div ref={bubbleRef} className="relative w-full">

            {/* ── Hover action bar (absolute, zero layout impact) ── */}
            <AnimatePresence>
              {isHovered && !isEditing && !confirmDelete && (
                <HoverActionBar
                  isMe={isMe}
                  hasText={hasText}
                  onReact={() => setShowQuickReact((p) => !p)}
                  onReply={() => { onReply?.(message); setIsHovered(false); }}
                  onCopy={handleCopyText}
                  onMore={handleMoreClick}
                />
              )}
            </AnimatePresence>

            {/* ── Quick emoji strip (absolute above bubble) ── */}
            <AnimatePresence>
              {showQuickReact && (
                <motion.div
                  ref={quickReactRef}
                  initial={{ opacity: 0, scale: 0.9, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  // 64px above bubble (top-8 for action bar + a bit more)
                  className={`absolute -top-16 ${
                    isMe ? "right-0" : "left-0"
                  } z-30 flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1.5 shadow-2xl`}
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { onReact?.(message.id, emoji); setShowQuickReact(false); setIsHovered(false); }}
                      className="rounded-full p-1.5 text-lg transition-transform hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                      aria-label={`React with ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowQuickReact(false); setShowFullReactionPicker(true); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-[var(--color-muted)] transition hover:bg-[var(--color-bg)] focus:outline-none"
                    aria-label="More emoji reactions"
                  >
                    ＋
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Full emoji picker (portal-rendered, no clipping) ── */}
            <AnimatePresence>
              {showFullReactionPicker && (
                <BodyPortal>
                  <motion.div
                    ref={fullPickerRef}
                    initial={{ opacity: 0, scale: 0.94, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "fixed",
                      zIndex: 99999,
                      // Position above/near the bubble
                      top: Math.max(8, (bubbleRef.current?.getBoundingClientRect().top ?? 200) - 450),
                      left: Math.min(
                        (bubbleRef.current?.getBoundingClientRect().left ?? 8),
                        window.innerWidth - 360
                      ),
                    }}
                    className="overflow-hidden rounded-2xl border border-[var(--color-border)] shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    <Picker
                      data={data}
                      onEmojiSelect={(emoji: any) => {
                        onReact?.(message.id, emoji.native);
                        setShowFullReactionPicker(false);
                        setIsHovered(false);
                      }}
                      theme="auto"
                      previewPosition="none"
                      searchPosition="top"
                      perLine={8}
                    />
                  </motion.div>
                </BodyPortal>
              )}
            </AnimatePresence>

            {/* ── Bubble tail nub (incoming, last of group) ── */}
            {showTail && (
              <span
                aria-hidden
                className="pointer-events-none absolute -left-1.5 bottom-2.5 h-3 w-3 rotate-45 rounded-bl-sm border-b border-l border-[var(--color-border)] bg-[var(--color-card)]"
              />
            )}

            {/* ════════════════════ THE BUBBLE ═════════════════════ */}
            <div
              className={`relative rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed shadow-sm transition-shadow ${
                isMe
                  ? "rounded-tr-md bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-teal)] text-white shadow-glow"
                  : "rounded-tl-md border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)]"
              } ${!showUsername && isMe ? "rounded-tr-2xl" : ""} ${
                !showUsername && !isMe ? "rounded-tl-2xl" : ""
              }`}
            >
              {/* Reply preview */}
              {message.metadata?.replyTo && (
                <button
                  type="button"
                  onClick={() => onReplyClick?.(message.metadata!.replyTo!.id)}
                  className={`mb-2.5 flex w-full cursor-pointer items-stretch gap-2 rounded-xl border-l-4 border-[var(--color-accent)] p-2 text-xs text-left transition hover:opacity-80 ${
                    isMe ? "bg-white/10" : "bg-[var(--color-bg-2)]"
                  }`}
                  aria-label={`Jump to message from ${message.metadata.replyTo.senderName}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold opacity-90">{message.metadata.replyTo.senderName}</p>
                    {message.metadata.replyTo.imageUrl ? (
                      <p className="mt-0.5 flex items-center gap-1 opacity-60"><span>📷</span> Photo</p>
                    ) : (
                      <p className="mt-0.5 truncate opacity-60">{message.metadata.replyTo.content}</p>
                    )}
                  </div>
                </button>
              )}

              {/* ── Edit mode ─────────────────────── */}
              {isEditing ? (
                <div className="flex flex-col gap-2 py-0.5">
                  <textarea
                    ref={editTextareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    rows={1}
                    className={`w-full min-w-[220px] resize-none overflow-hidden rounded-lg border p-2 text-sm outline-none transition focus:ring-1 ${
                      isMe
                        ? "border-white/20 bg-white/10 text-white placeholder-white/50 focus:border-white focus:ring-white/30"
                        : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/30"
                    }`}
                    aria-label="Edit message"
                  />
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="opacity-60 text-[var(--color-muted)]">Enter to save · Esc to cancel</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setIsEditing(false); setEditContent(message.content); }}
                        className={`rounded-md border px-2.5 py-1 font-semibold transition ${
                          isMe ? "border-white/20 text-white/80 hover:bg-white/10" : "border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-bg-2)]"
                        }`}
                        aria-label="Cancel editing"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleEdit}
                        className={`rounded-md px-2.5 py-1 font-semibold transition ${
                          isMe ? "bg-white text-[var(--color-accent)] hover:bg-white/90" : "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-2)]"
                        }`}
                        aria-label="Save edit"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* ── Inline delete confirm ──── */}
                  <AnimatePresence>
                    {confirmDelete && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-2 overflow-hidden rounded-xl border border-[var(--color-rose)]/30 bg-[var(--color-rose)]/10 px-3 py-2"
                      >
                        <p className="mb-1.5 text-[12px] font-semibold text-[var(--color-rose)]">Delete this message?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmDelete(false)}
                            className="flex-1 rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-muted)] transition hover:bg-[var(--color-bg)]"
                            aria-label="Cancel delete"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[var(--color-rose)] px-2.5 py-1 text-[11px] font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                            aria-label="Confirm delete"
                          >
                            {isDeleting
                              ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              : <><AlertTriangle size={11} /> Delete</>
                            }
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Message text */}
                  {hasText && <p className="whitespace-pre-wrap break-words">{message.content}</p>}

                  {/* Shared artwork card */}
                  {sharedArtwork && (
                    <Link
                      href={sharedArtwork.shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`mt-2 block overflow-hidden rounded-2xl border text-left shadow-sm transition hover:-translate-y-0.5 ${
                        isMe ? "border-white/15 bg-white/10 hover:bg-white/15" : "border-[var(--color-border)] bg-[var(--color-bg-2)] hover:border-[var(--color-accent)]/30"
                      }`}
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden">
                        <SafeImage src={normalizeImageSrc(sharedArtwork.imageUrl)} alt={sharedArtwork.title} fill sizes="(max-width: 768px) 100vw, 420px" className="object-cover" />
                      </div>
                      <div className={`space-y-1.5 p-3 ${isMe ? "text-white" : "text-[var(--color-text)]"}`}>
                        <p className="line-clamp-1 text-sm font-semibold">{sharedArtwork.title}</p>
                        <div className={`flex items-center justify-between gap-3 text-[11px] ${isMe ? "text-white/80" : "text-[var(--color-muted)]"}`}>
                          <span className="line-clamp-1">{sharedArtwork.sellerName || "ArtVerse"}</span>
                          {sharedArtwork.price !== undefined && (
                            <span className={`font-mono font-semibold ${isMe ? "text-white" : "text-[var(--color-accent)]"}`}>
                              {formatPrice(sharedArtwork.price)}
                            </span>
                          )}
                        </div>
                        <span className={`inline-flex text-[11px] font-semibold ${isMe ? "text-white/90" : "text-[var(--color-accent)]"}`}>
                          Open artwork →
                        </span>
                      </div>
                    </Link>
                  )}

                  {/* Image attachment */}
                  {!sharedArtwork && hasImage && (
                    <button
                      type="button"
                      onClick={() => { setIsLightboxOpen(true); setLightboxZoom(1); }}
                      className="mt-2 block max-w-full cursor-zoom-in overflow-hidden rounded-xl border border-[var(--color-border)]/50 transition hover:opacity-90"
                      aria-label="Open image fullscreen"
                    >
                      <SafeImage
                        src={normalizeImageSrc(message.imageUrl!)}
                        alt="Message attachment"
                        width={360}
                        height={260}
                        className="max-h-[260px] w-auto max-w-full object-contain"
                        loading="lazy"
                      />
                    </button>
                  )}

                  {/* Timestamp + edited */}
                  <div className={`mt-1.5 flex select-none items-center justify-end gap-1 text-[9.5px] leading-none ${isMe ? "text-white/60" : "text-[var(--color-muted)]"}`}>
                    {isEdited && <span className="italic opacity-80">edited ·</span>}
                    <span className="tabular-nums">
                      {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </>
              )}
            </div>
            {/* ══════════════════ end bubble ════════════════════════ */}
          </div>

          {/* ── Emoji reaction pills ──────────────── */}
          {message.metadata?.reactions && message.metadata.reactions.length > 0 && (
            <div className={`mt-1 flex flex-wrap gap-1 ${isMe ? "justify-end" : "justify-start"}`}>
              {message.metadata.reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => onReact?.(message.id, reaction.emoji)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold transition hover:scale-105 ${
                    reaction.userIds.includes(currentUserId ?? "")
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text)] hover:bg-[var(--color-bg-2)]"
                  }`}
                  aria-label={`${reaction.emoji} reaction, ${reaction.userIds.length} ${reaction.userIds.length === 1 ? "person" : "people"}`}
                >
                  <span aria-hidden>{reaction.emoji}</span>
                  <span className="text-[9.5px] tabular-nums">{reaction.userIds.length}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ══ Portal: Context menu (renders into document.body) ═══ */}
      <BodyPortal>
        {/* Backdrop – blocks pointer events on rest of page */}
        {menuCoords && (
          <div
            className="fixed inset-0"
            style={{ zIndex: 99998 }}
            onClick={closeMenu}
            aria-hidden
          />
        )}
        <AnimatePresence>
          {menuCoords && (
            <ContextMenu
              key="ctx-menu"
              coords={menuCoords}
              isMe={isMe}
              hasText={hasText}
              hasImage={hasImage}
              onClose={closeMenu}
              onEdit={() => { setIsEditing(true); closeMenu(); }}
              onDelete={() => { setConfirmDelete(true); closeMenu(); }}
              onReply={() => { onReply?.(message); closeMenu(); }}
              onCopyText={handleCopyText}
              onCopyImage={handleCopyImage}
              onReact={(emoji) => { onReact?.(message.id, emoji); closeMenu(); }}
              onOpenReactionPicker={() => { closeMenu(); setShowFullReactionPicker(true); }}
            />
          )}
        </AnimatePresence>
      </BodyPortal>

      {/* ══ Portal: Lightbox ════════════════════════════════════ */}
      <BodyPortal>
        <AnimatePresence>
          {isLightboxOpen && hasImage && (
            <motion.div
              key="lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ zIndex: 100000 }}
              className="fixed inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-md"
              onClick={() => setIsLightboxOpen(false)}
            >
              <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxZoom((z) => Math.min(4, z + 0.5)); }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                  aria-label="Zoom in"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxZoom((z) => Math.max(0.5, z - 0.5)); }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                  aria-label="Zoom out"
                >
                  <ZoomOut size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                  aria-label="Close image preview"
                >
                  <X size={18} />
                </button>
              </div>
              {lightboxZoom !== 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                  {Math.round(lightboxZoom * 100)}%
                </div>
              )}
              <div
                className="relative flex max-h-[85vh] max-w-[95vw] items-center justify-center"
                onClick={(e) => e.stopPropagation()}
                onWheel={handleLightboxWheel}
              >
                <motion.img
                  src={normalizeImageSrc(message.imageUrl!)}
                  alt="Enlarged attachment preview"
                  animate={{ scale: lightboxZoom }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="max-h-[85vh] max-w-[95vw] select-none rounded-lg object-contain shadow-2xl"
                  draggable={false}
                  style={{ cursor: lightboxZoom > 1 ? "grab" : "zoom-in" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </BodyPortal>
    </>
  );
}

ChatMessageComponent.displayName = "ChatMessage";
export const ChatMessage = memo(ChatMessageComponent);
