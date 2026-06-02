// ═══════════════════════════════════════════════════
// ArtVerse — Review Form Component
// ═══════════════════════════════════════════════════

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { useState, useCallback } from "react";
import toast from "react-hot-toast";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { StarRating } from "./StarRating";

interface ReviewFormProps {
  productId: string;
  /** Called after a review is successfully submitted */
  onReviewAdded: (review: any) => void;
}

export function ReviewForm({ productId, onReviewAdded }: ReviewFormProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});

  const validate = useCallback(() => {
    const newErrors: { rating?: string; comment?: string } = {};
    if (rating === 0) {
      newErrors.rating = "Please select a rating";
    }
    if (comment.length > 1000) {
      newErrors.comment = "Comment must be at most 1000 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [rating, comment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post(`/reviews/${productId}`, {
        rating,
        comment: comment.trim() || undefined,
      });

      const newReview = response.data.data;

      // Optimistically add the review
      onReviewAdded({
        ...newReview,
        user: {
          id: user?.id,
          name: user?.name,
          avatar: user?.avatar,
        },
      });

      // Reset form
      setRating(0);
      setComment("");
      setErrors({});
      toast.success("Review submitted successfully!");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to submit review";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Not authenticated — show login prompt
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-[var(--color-border)] bg-[var(--color-card)]/50 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)]/10">
          <LogIn size={20} className="text-[var(--color-accent)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">
            Sign in to leave a review
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Share your experience with this artwork
          </p>
        </div>
        <Link
          href="/auth/login"
          className="rounded-pill bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="font-display text-lg font-bold text-[var(--color-text)]">
        Write a Review
      </h3>

      {/* Star Selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
          Your Rating
        </label>
        <StarRating rating={rating} interactive onRate={setRating} size={24} />
        <AnimatePresence>
          {errors.rating && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1.5 text-xs text-[var(--color-rose)]"
            >
              {errors.rating}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Comment */}
      <div>
        <label
          htmlFor="review-comment"
          className="mb-2 block text-sm font-medium text-[var(--color-text)]"
        >
          Your Review{" "}
          <span className="text-[var(--color-muted)]">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about this artwork..."
          rows={4}
          maxLength={1000}
          className="w-full resize-none rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] transition focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/30"
        />
        <div className="mt-1 flex justify-between">
          <AnimatePresence>
            {errors.comment && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-[var(--color-rose)]"
              >
                {errors.comment}
              </motion.p>
            )}
          </AnimatePresence>
          <span className="ml-auto text-xs text-[var(--color-muted)]">
            {comment.length}/1000
          </span>
        </div>
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="flex items-center gap-2 rounded-input bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-6 py-3 text-sm font-semibold text-white shadow-glow transition-all hover:shadow-glow-md disabled:opacity-40 disabled:cursor-not-allowed"
        whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send size={16} />
            Submit Review
          </>
        )}
      </motion.button>
    </motion.form>
  );
}
