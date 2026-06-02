import Link from "next/link";
import { motion } from "framer-motion";
import { formatPrice, formatRelativeTime } from "@artverse/utils";
import { UserAvatar } from "@/components/UserAvatar";
import { SafeImage } from "@/components/SafeImage";
import { normalizeImageSrc } from "@/lib/image";

interface SharedArtworkCard {
  id: string;
  title: string;
  imageUrl: string;
  shareUrl: string;
  price?: number;
  sellerName?: string;
}

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    createdAt: string | Date;
    imageUrl?: string | null;
    metadata?: {
      artwork?: SharedArtworkCard;
    } | null;
    sender: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
  isMe: boolean;
  showAvatar: boolean;
}

export function ChatMessage({ message, isMe, showAvatar }: ChatMessageProps) {
  const sharedArtwork = message.metadata?.artwork;
  const sharedArtworkCardClassName = isMe
    ? "mt-3 block overflow-hidden rounded-2xl border border-white/15 bg-white/10 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white/15"
    : "mt-3 block overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-2)] text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]/30";
  const sharedArtworkTextClassName = isMe ? "space-y-1.5 p-3 text-white" : "space-y-1.5 p-3 text-[var(--color-text)]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`group flex w-full gap-3 ${isMe ? "flex-row-reverse" : "flex-row"} ${showAvatar ? "mt-4" : "mt-1"}`}
    >
      {/* Avatar Space */}
      <div className="flex w-9 shrink-0 flex-col items-center justify-end">
        {showAvatar ? (
          <UserAvatar
            name={message.sender.name}
            avatar={message.sender.avatar ?? null}
            className="h-9 w-9 border border-[var(--color-border)] shadow-sm"
            textClassName="text-[10px] font-semibold"
          />
        ) : (
          <span className="hidden text-[10px] text-[var(--color-muted)] opacity-0 transition group-hover:opacity-100 lg:block">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Message Bubble */}
      <div className={`flex max-w-[75%] flex-col ${isMe ? "items-end" : "items-start"}`}>
        {showAvatar && !isMe && (
          <div className="mb-1 flex items-baseline gap-2 pl-1">
            <span className="text-sm font-bold text-[var(--color-text)]">
              {message.sender.name}
            </span>
            <span className="text-[10px] font-medium text-[var(--color-muted)]">
              {formatRelativeTime(message.createdAt.toString())}
            </span>
          </div>
        )}
        <div
          className={`relative rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed shadow-sm backdrop-blur-sm ${
            isMe
              ? "bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-teal)] text-white shadow-glow"
              : "bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)]"
          } ${!showAvatar && isMe ? "rounded-tr-md" : ""} ${!showAvatar && !isMe ? "rounded-tl-md" : ""}`}
        >
          {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}

          {sharedArtwork && (
            <Link
              href={sharedArtwork.shareUrl}
              target="_blank"
              rel="noreferrer"
              className={sharedArtworkCardClassName}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <SafeImage
                  src={normalizeImageSrc(sharedArtwork.imageUrl)}
                  alt={sharedArtwork.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 420px"
                  className="object-cover"
                />
              </div>
              <div className={sharedArtworkTextClassName}>
                <p className="line-clamp-1 text-sm font-semibold">{sharedArtwork.title}</p>
                <div className={`flex items-center justify-between gap-3 text-[11px] ${isMe ? "text-white/80" : "text-[var(--color-muted)]"}`}>
                  <span className="line-clamp-1">{sharedArtwork.sellerName || "ArtVerse"}</span>
                  {sharedArtwork.price !== undefined && (
                    <span className={`font-mono font-semibold ${isMe ? "text-white" : "text-[var(--color-accent)]"}`}>{formatPrice(sharedArtwork.price)}</span>
                  )}
                </div>
                <span className={`inline-flex text-[11px] font-semibold ${isMe ? "text-white/90" : "text-[var(--color-accent)]"}`}>Open artwork</span>
              </div>
            </Link>
          )}

          {!sharedArtwork && message.imageUrl && (
            <div className={`mt-3 overflow-hidden rounded-2xl ${isMe ? "border border-white/15 bg-white/10" : "border border-[var(--color-border)] bg-[var(--color-bg-2)]"}`}>
              <SafeImage
                src={normalizeImageSrc(message.imageUrl)}
                alt="Message attachment"
                width={640}
                height={480}
                className="h-auto w-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
