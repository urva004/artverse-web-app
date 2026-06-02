// ═══════════════════════════════════════════════════
// ArtVerse — Product Card Component
// ═══════════════════════════════════════════════════

"use client";

import { motion } from "framer-motion";
import { MessageSquare, Share2, ShoppingCart, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { formatPrice, CATEGORY_LABELS } from "@artverse/utils";

import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useShareArtworkStore } from "@/store/shareArtworkStore";
import { WishlistButton } from "@/components/WishlistButton";
import { SafeImage } from "@/components/SafeImage";
import { normalizeImageSrc } from "@/lib/image";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  images: string[];
  category: string;
  averageRating: number;
  reviewCount: number;
  seller: {
    id: string;
    name: string;
    avatar: string | null;
  };
  stock: number;
  index?: number;
}

export function ProductCard({
  id,
  title,
  price,
  images,
  category,
  averageRating,
  reviewCount,
  seller,
  stock,
  index = 0,
}: ProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openShareArtwork = useShareArtworkStore((s) => s.openShareArtwork);
  const primaryImage = normalizeImageSrc(images[0]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: id,
      title,
      price,
      image: primaryImage,
      quantity: 1,
      stock,
      sellerName: seller.name,
    }, isAuthenticated);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      const url = `${window.location.origin}/marketplace/${id}`;

      try {
        if (navigator.share) {
          await navigator.share({ title, url });
        } else {
          await navigator.clipboard.writeText(url);
        }
      } catch {
        // Ignore share failures from user cancellation or clipboard restrictions.
      }
      return;
    }

    openShareArtwork({
      id,
      title,
      imageUrl: primaryImage,
      shareUrl: `${window.location.origin}/marketplace/${id}`,
      price,
      sellerName: seller.name,
    });
  };

  const handleCardClick = () => {
    router.push(`/marketplace/${id}`);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(`/marketplace/${id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <div
        role="link"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        className="group relative cursor-pointer overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <SafeImage
            src={primaryImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Category Badge */}
          <span className="absolute left-3 top-3 rounded-pill bg-[var(--color-bg)]/80 px-3 py-1 text-[11px] font-medium text-[var(--color-accent)] backdrop-blur-sm">
            {CATEGORY_LABELS[category] || category}
          </span>

          {/* Wishlist Button */}
          <div className="absolute right-3 top-3">
            <WishlistButton productId={id} size="sm" />
          </div>

          {/* Quick Add to Cart */}
          <motion.button
            onClick={handleAddToCart}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-pill bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white opacity-0 shadow-glow transition-all group-hover:opacity-100"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ShoppingCart size={14} />
            Add
          </motion.button>

          {/* Out of Stock */}
          {stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="rounded-pill bg-[var(--color-rose)] px-4 py-1.5 text-sm font-semibold text-white">
                Sold Out
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Seller */}
          <p className="mb-1 text-[11px] font-medium text-[var(--color-muted)]">
            {seller.name}
          </p>

          {/* Title */}
          <h3 className="mb-2 line-clamp-1 text-sm font-semibold text-[var(--color-text)]">
            {title}
          </h3>

          {/* Rating & Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star
                size={14}
                className="fill-[var(--color-gold)] text-[var(--color-gold)]"
              />
              <span className="text-xs font-medium text-[var(--color-text)]">
                {averageRating > 0 ? averageRating.toFixed(1) : "New"}
              </span>
              {reviewCount > 0 && (
                <span className="text-xs text-[var(--color-muted)]">
                  ({reviewCount})
                </span>
              )}
            </div>
            <span className="font-mono text-sm font-bold text-[var(--color-accent)]">
              {formatPrice(price)}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-[var(--color-border)] px-4 pb-4 pt-3">
          <Link
            href={`/marketplace/${id}#reviews`}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-pill bg-[var(--color-bg)] px-3 py-2 text-xs font-medium text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            <MessageSquare size={13} />
            {reviewCount}
          </Link>
          <button
            onClick={handleShare}
            className="flex h-9 w-9 items-center justify-center rounded-pill bg-[var(--color-bg)] text-[var(--color-muted)] transition hover:text-[var(--color-accent)]"
            aria-label="Share artwork"
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

