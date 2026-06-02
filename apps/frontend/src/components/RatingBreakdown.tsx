// ═══════════════════════════════════════════════════
// ArtVerse — Rating Breakdown Component
// ═══════════════════════════════════════════════════

"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface RatingBreakdownProps {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

export function RatingBreakdown({
  averageRating,
  totalReviews,
  distribution,
}: RatingBreakdownProps) {
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="flex flex-col gap-6 rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6 sm:flex-row sm:items-start sm:gap-10">
      {/* Average Rating Display */}
      <div className="flex flex-col items-center gap-2 sm:min-w-[120px]">
        <span className="font-display text-5xl font-bold text-[var(--color-text)]">
          {averageRating > 0 ? averageRating.toFixed(1) : "—"}
        </span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const diff = averageRating - i;
            const isFull = diff >= 0.75;
            const isHalf = diff >= 0.25 && diff < 0.75;

            if (isFull) {
              return (
                <Star
                  key={i}
                  size={16}
                  className="fill-[var(--color-gold)] text-[var(--color-gold)]"
                />
              );
            }
            if (isHalf) {
              return (
                <div
                  key={i}
                  className="relative"
                  style={{ width: 16, height: 16 }}
                >
                  <Star
                    size={16}
                    className="absolute inset-0 text-[var(--color-muted)]"
                  />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: 8 }}
                  >
                    <Star
                      size={16}
                      className="fill-[var(--color-gold)] text-[var(--color-gold)]"
                    />
                  </div>
                </div>
              );
            }
            return (
              <Star
                key={i}
                size={16}
                className="text-[var(--color-muted)]"
              />
            );
          })}
        </div>
        <span className="text-sm text-[var(--color-muted)]">
          {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
        </span>
      </div>

      {/* Distribution Bars */}
      <div className="flex flex-1 flex-col gap-2.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

          return (
            <div key={star} className="flex items-center gap-3">
              <span className="flex w-8 items-center gap-1 text-sm font-medium text-[var(--color-text)]">
                {star}
                <Star
                  size={12}
                  className="fill-[var(--color-gold)] text-[var(--color-gold)]"
                />
              </span>
              <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--color-bg-2)]">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background:
                      star >= 4
                        ? "var(--color-success)"
                        : star === 3
                          ? "var(--color-gold)"
                          : "var(--color-rose)",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{
                    duration: 0.8,
                    delay: (5 - star) * 0.1,
                    ease: "easeOut",
                  }}
                />
              </div>
              <span className="w-8 text-right text-xs font-medium text-[var(--color-muted)]">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
