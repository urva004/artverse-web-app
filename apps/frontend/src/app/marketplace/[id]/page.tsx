"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  User,
  Heart,
  Share2,
  Shield,
  Truck,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { formatPrice, CATEGORY_LABELS } from "@artverse/utils";
import { TextSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useShareArtworkStore } from "@/store/shareArtworkStore";
import { EditProductModal } from "@/components/dashboard/EditProductModal";
import { DeleteConfirmationModal } from "@/components/dashboard/DeleteConfirmationModal";
import { WishlistButton } from "@/components/WishlistButton";
import { StarRating } from "@/components/StarRating";
import { RatingBreakdown } from "@/components/RatingBreakdown";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList } from "@/components/ReviewList";
import { MoreVertical } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { normalizeImageSrc } from "@/lib/image";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const { user, isAuthenticated } = useAuthStore();
  const openShareArtwork = useShareArtworkStore((s) => s.openShareArtwork);
  const setInitialWishlistState = useWishlistStore(
    (s) => s.setInitialWishlistState,
  );

  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // ── Product Query ──
  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const r = await api.get(`/artworks/${id}`);
      return r.data.data;
    },
    enabled: !!id,
  });

  // Sync wishlist state from product response
  useEffect(() => {
    if (product && isAuthenticated) {
      setInitialWishlistState(product.id, product.isWishlisted ?? false);
    }
  }, [product, isAuthenticated, setInitialWishlistState]);

  // ── Reviews Query (separate, paginated) ──
  const [reviewPage, setReviewPage] = useState(1);
  const [allReviews, setAllReviews] = useState<any[]>([]);

  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    isFetching: reviewsFetching,
  } = useQuery({
    queryKey: ["reviews", id, reviewPage],
    queryFn: async () => {
      const r = await api.get(
        `/reviews/${id}?page=${reviewPage}&limit=5`,
      );
      return r.data;
    },
    enabled: !!id,
  });

  // Accumulate reviews across pages
  useEffect(() => {
    if (reviewsData?.data) {
      if (reviewPage === 1) {
        setAllReviews(reviewsData.data);
      } else {
        setAllReviews((prev) => {
          const existingIds = new Set(prev.map((r: any) => r.id));
          const newReviews = reviewsData.data.filter(
            (r: any) => !existingIds.has(r.id),
          );
          return [...prev, ...newReviews];
        });
      }
    }
  }, [reviewsData, reviewPage]);

  const handleLoadMore = useCallback(() => {
    setReviewPage((p) => p + 1);
  }, []);

  const handleReviewAdded = useCallback(
    (newReview: any) => {
      // Optimistic: prepend the new review
      setAllReviews((prev) => [newReview, ...prev]);
      // Invalidate queries to refetch accurate data
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    },
    [id, queryClient],
  );

  // ── Loading State ──
  if (isLoading)
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="skeleton-shimmer aspect-square rounded-card" />
          <div className="space-y-4">
            <TextSkeleton width="w-24" />
            <TextSkeleton width="w-3/4" height="h-8" />
            <TextSkeleton />
            <TextSkeleton width="w-32" height="h-10" />
          </div>
        </div>
      </div>
    );

  // ── Error State ──
  if (isError || !product)
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <h2 className="font-display text-xl">Artwork not found</h2>
        <Link
          href="/marketplace"
          className="rounded-pill bg-[var(--color-accent)] px-6 py-2 text-sm font-semibold text-white"
        >
          Back to Marketplace
        </Link>
      </div>
    );

  const primaryArtworkImage = normalizeImageSrc(product.images?.[0]);
  const selectedArtworkImage = normalizeImageSrc(product.images?.[selectedImage]);

  const handleAddToCart = async () => {
    await addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: primaryArtworkImage,
      quantity: 1,
      stock: product.stock,
      sellerName: product.seller.name,
    }, isAuthenticated);
    toast.success("Added to cart!");
  };

  const handleShare = async () => {
    if (!isAuthenticated) {
      const url = `${window.location.origin}/marketplace/${product.id}`;

      try {
        if (navigator.share) {
          await navigator.share({
            title: product.title,
            url,
          });
        } else {
          await navigator.clipboard.writeText(url);
          toast.success("Artwork link copied");
        }
      } catch {
        // Ignore user-cancelled share dialogs.
      }
      return;
    }

    openShareArtwork({
      id: product.id,
      title: product.title,
      imageUrl: primaryArtworkImage,
      shareUrl: `${window.location.origin}/marketplace/${product.id}`,
      price: product.price,
      sellerName: product.seller.name,
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link href="/marketplace" className="hover:text-[var(--color-accent)]">
          Marketplace
        </Link>
        <span>/</span>
        <span className="text-[var(--color-text)]">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* ════════════════════════════════════
            Image Gallery
            ════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative aspect-square overflow-hidden rounded-card border border-[var(--color-border)]">
            <SafeImage
              src={selectedArtworkImage}
              alt={product.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setSelectedImage(
                      (p) =>
                        (p - 1 + product.images.length) %
                        product.images.length,
                    )
                  }
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-bg)]/80 backdrop-blur"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() =>
                    setSelectedImage(
                      (p) => (p + 1) % product.images.length,
                    )
                  }
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-bg)]/80 backdrop-blur"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {product.images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-input border-2 transition ${i === selectedImage ? "border-[var(--color-accent)]" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <SafeImage
                    src={normalizeImageSrc(img)}
                    alt={`${product.title} ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* ════════════════════════════════════
            Product Info
            ════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-6"
        >
          <span className="inline-block rounded-pill bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
            {CATEGORY_LABELS[product.category] || product.category}
          </span>
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-display text-display-sm">{product.title}</h1>
            {user?.id === product.seller.id && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="mt-2 rounded-full p-2 text-[var(--color-muted)] hover:bg-[var(--color-border)] transition"
                >
                  <MoreVertical size={20} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] py-2 shadow-2xl z-50">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowEdit(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm font-semibold transition hover:bg-[var(--color-card)]"
                    >
                      Edit Artwork
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowDelete(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm font-semibold text-[var(--color-rose)] transition hover:bg-[var(--color-rose)]/10"
                    >
                      Delete Artwork
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Dynamic Star Rating ── */}
          <div className="flex items-center gap-3">
            <StarRating rating={product.averageRating} size={16} />
            <span className="text-sm font-medium">
              {product.averageRating > 0
                ? product.averageRating.toFixed(1)
                : "New"}
            </span>
            <span className="text-sm text-[var(--color-muted)]">
              ({product.reviewCount} reviews)
            </span>
            <span className="flex items-center gap-1 text-sm text-[var(--color-muted)]">
              <Heart size={14} className="fill-[var(--color-rose)] text-[var(--color-rose)]" />
              {product.likeCount ?? 0} likes
            </span>
          </div>

          <p className="font-mono text-3xl font-bold text-[var(--color-accent)]">
            {formatPrice(product.price)}
          </p>
          <p className="leading-relaxed text-[var(--color-muted)]">
            {product.description}
          </p>
          <p className="text-sm">
            {product.stock > 0 ? (
              <span className="text-[var(--color-success)]">
                ✓ In Stock ({product.stock})
              </span>
            ) : (
              <span className="text-[var(--color-rose)]">✗ Out of Stock</span>
            )}
          </p>

          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-pill border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* ── Action Buttons (Cart + Wishlist + Share) ── */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-input bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] py-3.5 text-sm font-semibold text-white shadow-glow hover:shadow-glow-md disabled:opacity-40"
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>
            <WishlistButton productId={product.id} size="md" />
            <button
              onClick={handleShare}
              className="flex h-12 w-12 items-center justify-center rounded-input border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              aria-label="Share artwork"
            >
              <Share2 size={18} />
            </button>
          </div>

          {/* ── Trust Badges ── */}
          <div className="grid grid-cols-3 gap-3 rounded-card border border-[var(--color-border)] bg-[var(--color-bg-2)] p-4">
            {[
              { icon: Shield, label: "Secure Payment" },
              { icon: Truck, label: "Safe Delivery" },
              { icon: RotateCcw, label: "Easy Returns" },
            ].map((b) => (
              <div
                key={b.label}
                className="flex flex-col items-center gap-1.5 text-center"
              >
                <b.icon size={18} className="text-[var(--color-teal)]" />
                <span className="text-[10px] text-[var(--color-muted)]">
                  {b.label}
                </span>
              </div>
            ))}
          </div>

          {/* ── Seller Card ── */}
          <Link
            href={`/artists/${product.seller.id}`}
            className="flex items-center gap-3 rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition hover:opacity-80"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
              <User size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold">{product.seller.name}</p>
              <p className="text-xs text-[var(--color-muted)]">View Profile</p>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════
          Customer Reviews Section
          ════════════════════════════════════════════════ */}
      <motion.section
        id="reviews"
        className="mt-16"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="mb-8 flex items-center gap-3">
          <MessageSquare
            size={24}
            className="text-[var(--color-accent)]"
          />
          <h2 className="font-display text-xl font-bold">Comments & Reviews</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          {/* Left column: Rating Breakdown + Review Form */}
          <div className="space-y-6">
            {/* Rating Breakdown */}
            <RatingBreakdown
              averageRating={
                reviewsData?.averageRating ?? product.averageRating ?? 0
              }
              totalReviews={
                reviewsData?.totalReviews ?? product.reviewCount ?? 0
              }
              distribution={
                reviewsData?.ratingDistribution ?? {
                  1: 0,
                  2: 0,
                  3: 0,
                  4: 0,
                  5: 0,
                }
              }
            />

            {/* Add Review Form */}
            <ReviewForm
              productId={id}
              onReviewAdded={handleReviewAdded}
            />
          </div>

          {/* Right column: Review List */}
          <div>
            <ReviewList
              reviews={allReviews}
              isLoading={reviewsLoading && reviewPage === 1}
              hasMore={reviewsData?.pagination?.hasNext ?? false}
              onLoadMore={handleLoadMore}
              isLoadingMore={reviewsFetching && reviewPage > 1}
            />
          </div>
        </div>
      </motion.section>

      {/* ── Modals ── */}
      {showEdit && (
        <EditProductModal
          product={product}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showDelete && (
        <DeleteConfirmationModal
          productId={product.id}
          productName={product.title}
          onClose={() => {
            setShowDelete(false);
            router.push("/dashboard/products");
          }}
        />
      )}
    </div>
  );
}
