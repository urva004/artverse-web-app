"use client";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Loader2, Paperclip, Send, Smile, X } from "lucide-react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { api } from "@/lib/api";

import type { ChatSendPayload } from "./types";

interface ChatInputProps {
  onSend: (payload: ChatSendPayload) => Promise<void> | void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
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
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.drawImage(image, 0, 0, width, height);

  const compressedBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.82);
  });

  if (!compressedBlob) {
    return file;
  }

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
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPanelRef = useRef<HTMLDivElement>(null);
  // message state is kept internal — parent never needs to re-render on keystrokes
  const [message, setMessage] = useState("");
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!attachment) {
      setAttachmentPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(attachment);
    setAttachmentPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [attachment]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (emojiPanelRef.current && !emojiPanelRef.current.contains(event.target as Node)) {
        setIsEmojiOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "auto";
    const scrollHeight = textareaRef.current.scrollHeight;
    textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
  }, [message]);

  const insertTextAtCursor = (text: string) => {
    const input = textareaRef.current;

    if (!input) {
      setMessage(`${message}${text}`);
      return;
    }

    const selectionStart = input.selectionStart ?? message.length;
    const selectionEnd = input.selectionEnd ?? message.length;
    const nextValue = `${message.slice(0, selectionStart)}${text}${message.slice(selectionEnd)}`;

    setMessage(nextValue);

    window.requestAnimationFrame(() => {
      const nextCursorPosition = selectionStart + text.length;
      input.focus();
      input.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  };

  const validateAttachment = (file: File): boolean => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be 5MB or smaller");
      return false;
    }

    return true;
  };

  const handleAttachment = (file: File | undefined) => {
    if (!file || !validateAttachment(file)) {
      return;
    }

    setAttachment(file);
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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if ((!trimmedMessage && !attachment) || disabled || isUploading) {
      return;
    }

    try {
      setIsUploading(true);

      const imageUrl = attachment
        ? await uploadImage(attachment, setUploadProgress)
        : undefined;

      await onSend({
        content: trimmedMessage,
        imageUrl,
        metadata: attachment
          ? {
              attachmentType: "image",
              fileName: attachment.name,
              fileSize: attachment.size,
            }
          : undefined,
      });

      setMessage("");
      removeAttachment();
      setIsEmojiOpen(false);
    } catch (error: any) {
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

  return (
    <div className="shrink-0 p-4 pt-2">
      <div
        className={`relative flex flex-col gap-3 rounded-2xl border bg-[var(--color-card)] p-3 shadow-sm transition ${dragActive ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]" : "border-[var(--color-border)] focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)]"}`}
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(false);
        }}
        onDrop={handleDrop}
      >
        {attachmentPreview && attachment && (
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--color-card)]">
              <img
                src={attachmentPreview}
                alt={attachment.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {(attachment.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-bg-2)] hover:text-[var(--color-text)]"
                  aria-label="Remove attachment"
                >
                  <X size={16} />
                </button>
              </div>

              {isUploading && (
                <div className="mt-2">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--color-muted)]">
                    <span>Uploading image</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-bg-2)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
            className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
            aria-label="Attach image"
          >
            <Paperclip size={18} />
          </button>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              onTyping?.();
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled || isUploading}
            placeholder={placeholder}
            className="max-h-[120px] w-full resize-none border-none bg-transparent py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-0 disabled:opacity-60"
            rows={1}
          />

          <div ref={emojiPanelRef} className="mb-1">
            <button
              type="button"
              onClick={() => setIsEmojiOpen((open) => !open)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
              aria-label="Add emoji"
            >
              <Smile size={18} />
            </button>

            {isEmojiOpen && (
              <div className="absolute bottom-16 left-0 right-0 mx-auto max-w-[calc(100vw-2rem)] md:left-auto md:right-12 md:mx-0 w-[352px] z-50 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
                <Picker
                  data={data}
                  onEmojiSelect={(emoji: any) => insertTextAtCursor(emoji.native)}
                  theme="auto"
                  previewPosition="none"
                  searchPosition="top"
                  skinTonePosition="search"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={(!message.trim() && !attachment) || disabled || isUploading}
            className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-glow transition hover:bg-[var(--color-accent-2)] disabled:scale-95 disabled:opacity-40 disabled:shadow-none"
            aria-label="Send message"
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="-ml-0.5" />}
          </button>
        </div>

        {dragActive && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-accent)]/5" />
        )}
      </div>
    </div>
  );
}
