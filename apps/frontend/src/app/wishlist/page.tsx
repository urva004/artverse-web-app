"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Star } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatPrice } from "@artverse/utils";
import { ProductGridSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { SafeImage } from "@/components/SafeImage";
import { normalizeImageSrc } from "@/lib/image";

export default function WishlistPage() {
  const queryClient = useQueryClient();
  const addItem = useCartStore((s) => s.addItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const r = await api.get("/wishlist");
      return r.data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      await api.post(`/wishlist/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
  });

  const items = data?.data ?? [];

  if (isLoading)
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <ProductGridSkeleton count={4} />
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        <h1 className="mb-2 font-display text-display-sm">
          My <span className="gradient-text">Saved Artworks</span>
        </h1>
        <p className="text-[var(--color-muted)]">{items.length} saved artworks</p>
      </motion.div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-card)]">
            <Heart size={28} className="text-[var(--color-muted)]" />
          </div>
          <h3 className="font-display text-lg font-bold">No saved items yet</h3>
          <p className="text-sm text-[var(--color-muted)]">
            Heart items you love to save them here
          </p>
          <Link
            href="/marketplace"
            className="mt-2 rounded-pill bg-[var(--color-accent)] px-8 py-3 text-sm font-semibold text-white shadow-glow"
          >
            Browse Art
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item: any, i: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="group overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)] transition-all hover:-translate-y-1 hover:shadow-card-hover">
                <Link href={`/marketplace/${item.product.id}`}>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <SafeImage
                      src={normalizeImageSrc(item.product.images?.[0])}
                      alt={item.product.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <p className="mb-1 text-[11px] text-[var(--color-muted)]">
                    {item.product.seller.name}
                  </p>
                  <Link href={`/marketplace/${item.product.id}`}>
                    <h3 className="mb-2 line-clamp-1 text-sm font-semibold hover:text-[var(--color-accent)]">
                      {item.product.title}
                    </h3>
                  </Link>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star
                        size={12}
                        className="fill-[var(--color-gold)] text-[var(--color-gold)]"
                      />
                      <span className="text-xs">
                        {item.product.averageRating > 0
                          ? item.product.averageRating.toFixed(1)
                          : "New"}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-bold text-[var(--color-accent)]">
                      {formatPrice(item.product.price)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        addItem({
                          productId: item.product.id,
                          title: item.product.title,
                          price: item.product.price,
                          image: normalizeImageSrc(item.product.images?.[0]),
                          quantity: 1,
                          stock: item.product.stock,
                          sellerName: item.product.seller.name,
                        }, isAuthenticated);
                        toast.success("Added to cart!");
                      }}
                      disabled={item.product.stock === 0}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-input bg-[var(--color-accent)] py-2 text-xs font-semibold text-white transition hover:bg-[var(--color-accent-2)] disabled:opacity-40"
                    >
                      <ShoppingCart size={14} />
                      Add
                    </button>
                    <button
                      onClick={() => removeMutation.mutate(item.product.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-input border border-[var(--color-border)] text-[var(--color-rose)] transition hover:border-[var(--color-rose)] hover:bg-[var(--color-rose)]/10"
                    >
                      <Heart size={14} className="fill-[var(--color-rose)]" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
