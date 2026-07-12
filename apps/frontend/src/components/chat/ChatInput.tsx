"use client";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Loader2, Paperclip, Send, Smile, X, Image as ImageIcon } from "lucide-react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

import { api } from "@/lib/api";
import type { ChatTimelineMessage } from "@/lib/chat";
import type { ChatSendPayload } from "./types";
import { normalizeImageSrc } from "@/lib/image";
import { SafeImage } from "@/components/SafeImage";

interface ChatInputProps {
  onSend: (payload: ChatSendPayload) => Promise<void> | void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  replyingTo?: ChatTimelineMessage | null;
  onCancelReply?: () => void;
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 1280;

async function loadImage(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to read image"));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(image, 0, 0, width, height);
  const compressedBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.82);
  });
  if (!compressedBlob) return file;
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([compressedBlob], `${baseName}.webp`, { type: "image/webp" });
}

async function uploadImage(file: File, onProgress: (progress: number) => void): Promise<string> {
  const compressedFile = await compressImage(file);
  const formData = new FormData();
  formData.append("image", compressedFile);
  const response = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (!event.total) return;
      onProgress(Math.round((event.loaded * 100) / event.total));
    },
  });
  return response.data?.data?.url as string;
}

export function ChatInput({
  onSend,
  onTyping,
  disabled = false,
  placeholder = "Message the community...",
  replyingTo = null,
  onCancelReply,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPanelRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const [message, setMessage] = useState("");
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sendPulse, setSendPulse] = useState(false);

  // ── Attachment preview URL ──
  useEffect(() => {
    if (!attachment) { setAttachmentPreview(null); return; }
    const previewUrl = URL.createObjectURL(attachment);
    setAttachmentPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [attachment]);

  // ── Close emoji picker on outside click ──
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        emojiPanelRef.current &&
        !emojiPanelRef.current.contains(event.target as Node) &&
        !emojiButtonRef.current?.contains(event.target as Node)
      ) {
        setIsEmojiOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  // ── Auto-grow textarea ──
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
  }, [message]);

  const insertTextAtCursor = useCallback((text: string) => {
    const input = textareaRef.current;
    if (!input) { setMessage((m) => `${m}${text}`); return; }
    const start = input.selectionStart ?? message.length;
    const end = input.selectionEnd ?? message.length;
    const next = `${message.slice(0, start)}${text}${message.slice(end)}`;
    setMessage(next);
    window.requestAnimationFrame(() => {
      const pos = start + text.length;
      input.focus();
      input.setSelectionRange(pos, pos);
    });
  }, [message]);

  const validateAttachment = (file: File): boolean => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be 5 MB or smaller");
      return false;
    }
    return true;
  };

  const handleAttachment = (file: File | undefined) => {
    if (!file || !validateAttachment(file)) return;
    setAttachment(file);
    setUploadError(false);
    setIsEmojiOpen(false);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleAttachment(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    handleAttachment(event.dataTransfer.files?.[0]);
  };

  const removeAttachment = () => {
    setAttachment(null);
    setUploadProgress(0);
    setUploadError(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if ((!trimmedMessage && !attachment) || disabled || isUploading) return;

    // Micro-animation on send
    setSendPulse(true);
    setTimeout(() => setSendPulse(false), 300);

    try {
      setIsUploading(true);
      setUploadError(false);
      const imageUrl = attachment ? await uploadImage(attachment, setUploadProgress) : undefined;
      await onSend({ content: trimmedMessage, imageUrl, metadata: attachment ? { attachmentType: "image", fileName: attachment.name, fileSize: attachment.size } : undefined });
      setMessage("");
      removeAttachment();
      setIsEmojiOpen(false);
      // Re-focus textarea after send
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (error: any) {
      setUploadError(true);
      toast.error(error?.response?.data?.message || error?.message || "Failed to send message");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item && item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) { event.preventDefault(); handleAttachment(file); break; }
      }
    }
  };

  // Reply preview image (if replying to an image message)
  const replyImageUrl = replyingTo?.imageUrl;

  return (
    <div
      className="shrink-0 p-3 pt-1"
      onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
      onDrop={handleDrop}
    >
      <div
        className={`relative flex flex-col gap-2 rounded-2xl border bg-[var(--color-card)] px-3 py-2.5 shadow-sm transition-all duration-150 ${
          dragActive
            ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30"
            : isFocused
              ? "border-[var(--color-accent)]/60 ring-1 ring-[var(--color-accent)]/20"
              : "border-[var(--color-border)]"
        }`}
      >
        {/* ── Drag-and-drop overlay ── */}
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-accent)]/5"
            >
              <ImageIcon size={28} className="text-[var(--color-accent)] opacity-60" />
              <p className="text-xs font-semibold text-[var(--color-accent)]">Drop image to attach</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Reply preview ── */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-2 text-left text-xs">
                <div className="flex min-w-0 items-center gap-2">
                  {/* Image thumbnail if replying to image */}
                  {replyImageUrl && (
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border)]">
                      <SafeImage
                        src={normalizeImageSrc(replyImageUrl)}
                        alt="Replied image"
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 border-l-4 border-[var(--color-accent)] pl-2">
                    <span className="block font-bold text-[var(--color-accent)]">
                      Replying to {replyingTo.sender.name}
                    </span>
                    <p className="truncate text-[var(--color-muted)] mt-0.5">
                      {replyImageUrl ? "📷 Photo" : replyingTo.content}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCancelReply}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                  aria-label="Cancel reply"
                >
                  <X size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Attachment preview ── */}
        <AnimatePresence>
          {attachmentPreview && attachment && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-2.5"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--color-card)]">
                <img src={attachmentPreview} alt={attachment.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-[var(--color-text)]">{attachment.name}</p>
                    <p className="text-[11px] text-[var(--color-muted)]">{(attachment.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-bg-2)] hover:text-[var(--color-text)]"
                    aria-label="Remove attachment"
                  >
                    <X size={14} />
                  </button>
                </div>
                {isUploading && (
                  <div className="mt-1.5">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--color-muted)]">
                      <span>Uploading…</span>
                      <span className="tabular-nums">{uploadProgress}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-[var(--color-bg-2)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {uploadError && (
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[var(--color-rose)]">Upload failed</span>
                    <button type="button" onClick={handleSend} className="font-bold text-[var(--color-accent)] hover:underline">
                      Retry
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main input row ── */}
        <div className="relative flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
            aria-label="Attach image"
          >
            <Paperclip size={17} />
          </button>

          <div className="flex flex-1 flex-col">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(event) => { setMessage(event.target.value); onTyping?.(); }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled || isUploading}
              placeholder={placeholder}
              className="max-h-[120px] w-full resize-none border-none bg-transparent py-1.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-0 disabled:opacity-60"
              rows={1}
              aria-label="Message input"
              aria-multiline="true"
            />
          </div>

          {/* Emoji button + picker */}
          <div className="relative mb-0.5">
            <button
              ref={emojiButtonRef}
              type="button"
              onClick={() => setIsEmojiOpen((open) => !open)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
              aria-label="Add emoji"
              aria-expanded={isEmojiOpen}
            >
              <Smile size={17} />
            </button>

            {/* Emoji picker — fixed to viewport bottom to avoid clipping on mobile */}
            <AnimatePresence>
              {isEmojiOpen && (
                <motion.div
                  ref={emojiPanelRef}
                  initial={{ opacity: 0, scale: 0.94, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full right-0 mb-2 z-50 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl"
                  style={{ width: "min(352px, calc(100vw - 1.5rem))" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Picker
                    data={data}
                    onEmojiSelect={(emoji: any) => { insertTextAtCursor(emoji.native); }}
                    theme="auto"
                    previewPosition="none"
                    searchPosition="top"
                    skinTonePosition="search"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Send button with micro-animation */}
          <motion.button
            type="button"
            onClick={handleSend}
            disabled={(!message.trim() && !attachment) || disabled || isUploading}
            animate={sendPulse ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.25 }}
            className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-glow transition hover:bg-[var(--color-accent-2)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            aria-label="Send message"
          >
            {isUploading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} className="-ml-px" />
            )}
          </motion.button>
        </div>

        {/* ── Keyboard hint (on focus) ── */}
        <AnimatePresence>
          {isFocused && !isUploading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="select-none text-[10px] text-[var(--color-muted)] pl-1"
            >
              <kbd className="rounded border border-[var(--color-border)] px-1 py-px font-mono text-[9px]">Enter</kbd>
              {" "}to send ·{" "}
              <kbd className="rounded border border-[var(--color-border)] px-1 py-px font-mono text-[9px]">Shift+Enter</kbd>
              {" "}for new line
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
