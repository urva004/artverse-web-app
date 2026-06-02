// ═══════════════════════════════════════════════════
// ArtVerse — Star Rating Component
// ═══════════════════════════════════════════════════

"use client";

import { motion } from "framer-motion";
import { Star, StarHalf } from "lucide-react";
import { useState, useCallback } from "react";

interface StarRatingProps {
  /** Current rating value (0-5) */
  rating: number;
  /** If true, user can click/hover to select rating */
  interactive?: boolean;
  /** Callback when user selects a rating (interactive mode) */
  onRate?: (rating: number) => void;
  /** Star icon size */
  size?: number;
  /** Show numeric value next to stars */
  showValue?: boolean;
  /** Additional text (e.g., review count) */
  label?: string;
}

export function StarRating({
  rating,
  interactive = false,
  onRate,
  size = 16,
  showValue = false,
  label,
}: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState(0);

  const displayRating = interactive && hoveredStar > 0 ? hoveredStar : rating;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, starValue: number) => {
      if (!interactive || !onRate) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onRate(starValue);
      } else if (e.key === "ArrowRight" && starValue < 5) {
        e.preventDefault();
        onRate(starValue + 1);
      } else if (e.key === "ArrowLeft" && starValue > 1) {
        e.preventDefault();
        onRate(starValue - 1);
      }
    },
    [interactive, onRate],
  );

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const diff = displayRating - index;

    // Determine star fill state
    let starType: "full" | "half" | "empty";
    if (diff >= 0.75) {
      starType = "full";
    } else if (diff >= 0.25) {
      starType = "half";
    } else {
      starType = "empty";
    }

    const starElement =
      starType === "full" ? (
        <Star
          size={size}
          className="fill-[var(--color-gold)] text-[var(--color-gold)]"
        />
      ) : starType === "half" ? (
        <div className="relative" style={{ width: size, height: size }}>
          {/* Empty star background */}
          <Star
            size={size}
            className="absolute inset-0 text-[var(--color-muted)]"
          />
          {/* Half-filled star with clip */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: size / 2 }}
          >
            <Star
              size={size}
              className="fill-[var(--color-gold)] text-[var(--color-gold)]"
            />
          </div>
        </div>
      ) : (
        <Star size={size} className="text-[var(--color-muted)]" />
      );

    if (interactive) {
      return (
        <motion.button
          key={index}
          type="button"
          onClick={() => onRate?.(starValue)}
          onMouseEnter={() => setHoveredStar(starValue)}
          onMouseLeave={() => setHoveredStar(0)}
          onKeyDown={(e) => handleKeyDown(e, starValue)}
          className="cursor-pointer bg-transparent border-none p-0.5 transition-transform duration-150 hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded"
          whileTap={{ scale: 0.85 }}
          role="radio"
          aria-checked={rating === starValue}
          aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
          tabIndex={0}
        >
          {starElement}
        </motion.button>
      );
    }

    return <span key={index}>{starElement}</span>;
  };

  return (
    <div
      className="flex items-center gap-1"
      role={interactive ? "radiogroup" : "img"}
      aria-label={
        interactive
          ? "Select a rating"
          : `Rating: ${rating.toFixed(1)} out of 5 stars`
      }
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => renderStar(i))}
      </div>
      {showValue && (
        <span className="ml-1 text-sm font-medium text-[var(--color-text)]">
          {rating > 0 ? rating.toFixed(1) : "New"}
        </span>
      )}
      {label && (
        <span className="text-sm text-[var(--color-muted)]">{label}</span>
      )}
    </div>
  );
}
