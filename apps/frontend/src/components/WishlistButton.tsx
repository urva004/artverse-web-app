// ═══════════════════════════════════════════════════
// ArtVerse — Wishlist Button Component
// ═══════════════════════════════════════════════════

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2 } from "lucide-react";
import { useCallback } from "react";

import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";

interface WishlistButtonProps {
  productId: string;
  /** "sm" for card usage, "md" for detail page */
  size?: "sm" | "md";
  /** Optional className override */
  className?: string;
}

export function WishlistButton({
  productId,
  size = "md",
  className,
}: WishlistButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const wishlisted = useWishlistStore((s) => s.wishlistedIds.has(productId));
  const isLoading = useWishlistStore((s) => s.loadingIds.has(productId));
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated) return;
      toggleWishlist(productId);
    },
    [isAuthenticated, productId, toggleWishlist],
  );

  if (!isAuthenticated) return null;

  const iconSize = size === "sm" ? 16 : 18;
  const buttonSize = size === "sm" ? "h-8 w-8" : "h-12 w-12";

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading}
      className={
        className ||
        `flex ${buttonSize} items-center justify-center rounded-full transition-all duration-200 ${
          size === "sm"
            ? "bg-[var(--color-bg)]/80 backdrop-blur-sm"
            : "rounded-input border border-[var(--color-border)]"
        } ${
          wishlisted
            ? "border-[var(--color-rose)] text-[var(--color-rose)]"
            : "text-[var(--color-muted)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)]"
        }`
      }
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
          >
            <Loader2 size={iconSize} className="animate-spin" />
          </motion.div>
        ) : (
          <motion.div
            key={wishlisted ? "filled" : "outline"}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <Heart
              size={iconSize}
              className={
                wishlisted
                  ? "fill-[var(--color-rose)] text-[var(--color-rose)]"
                  : ""
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
