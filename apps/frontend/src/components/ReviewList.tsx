// ═══════════════════════════════════════════════════
// ArtVerse — Review List Component
// ═══════════════════════════════════════════════════

"use client";

import { motion } from "framer-motion";
import { User, ChevronDown } from "lucide-react";

import { formatDate } from "@artverse/utils";
import { StarRating } from "./StarRating";
import { UserAvatar } from "@/components/UserAvatar";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface ReviewListProps {
  reviews: Review[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

/** Skeleton placeholder for a single review card */
function ReviewSkeleton() {
  return (
    <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full skeleton-shimmer" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 rounded skeleton-shimmer" />
            <div className="h-2.5 w-16 rounded skeleton-shimmer" />
          </div>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 w-3 rounded skeleton-shimmer" />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded skeleton-shimmer" />
        <div className="h-3 w-3/4 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}

/** Calculate relative time string */
function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function ReviewList({
  reviews,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}: ReviewListProps) {
  // Show skeleton loaders while loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <ReviewSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-[var(--color-border)] py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-card)]">
          <User size={20} className="text-[var(--color-muted)]" />
        </div>
        <p className="text-sm font-medium text-[var(--color-muted)]">
          No reviews yet. Be the first to share your thoughts!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review, index) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-5 transition-all hover:border-[var(--color-border)]/80"
        >
          {/* Header: Avatar + Name + Date | Stars */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={review.user.name}
                avatar={review.user.avatar}
                className="h-9 w-9"
                textClassName="text-[10px] font-semibold"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {review.user.name}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  {timeAgo(review.createdAt)}
                </p>
              </div>
            </div>
            <StarRating rating={review.rating} size={14} />
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-sm leading-relaxed text-[var(--color-muted)]">
              {review.comment}
            </p>
          )}
        </motion.div>
      ))}

      {/* Load More */}
      {hasMore && (
        <motion.div
          className="flex justify-center pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 rounded-pill border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-2.5 text-sm font-medium text-[var(--color-text)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Load More Reviews
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  );
}
