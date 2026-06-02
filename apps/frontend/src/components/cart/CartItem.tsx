"use client";

import { motion } from "framer-motion";
import { Trash2, ExternalLink, Bookmark, BookmarkPlus } from "lucide-react";
import Link from "next/link";
import { formatPrice, type CartItem as CartItemType } from "@artverse/utils";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { QuantitySelector } from "./QuantitySelector";
import { SafeImage } from "@/components/SafeImage";

interface CartItemProps {
  item: CartItemType;
  index: number;
}

export function CartItem({ item, index }: CartItemProps) {
  const { removeItem, toggleSaveForLater } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative flex flex-col gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition-all hover:border-[var(--color-accent-soft)] hover:shadow-lg sm:flex-row sm:items-center"
    >
      {/* Product Image */}
      <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-24">
        <SafeImage
          src={item.image}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, 96px"
        />
        <div className="absolute inset-0 bg-black/5 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/marketplace/${item.productId}`}
              className="group/link flex items-center gap-1.5 text-base font-bold transition-colors hover:text-[var(--color-accent)]"
            >
              {item.title}
              <ExternalLink size={14} className="opacity-0 transition-opacity group-hover/link:opacity-100" />
            </Link>
            <p className="text-xs text-[var(--color-muted)]">
              by <span className="font-medium text-[var(--color-text-soft)]">{item.sellerName}</span>
            </p>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => toggleSaveForLater(item.productId, !item.isSavedForLater, isAuthenticated)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)] transition-all hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
              title={item.isSavedForLater ? "Move to Cart" : "Save for Later"}
            >
              {item.isSavedForLater ? <BookmarkPlus size={16} /> : <Bookmark size={16} />}
            </button>
            <button
              onClick={() => removeItem(item.productId, isAuthenticated)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)] transition-all hover:bg-[var(--color-rose-soft)] hover:text-[var(--color-rose)]"
              title="Remove item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {!item.isSavedForLater && (
            <QuantitySelector 
              productId={item.productId} 
              initialQuantity={item.quantity} 
              stock={item.stock} 
            />
          )}
          
          {item.stock < 5 && item.stock > 0 && !item.isSavedForLater && (
            <span className="text-[10px] font-bold text-[var(--color-rose)] animate-pulse">
              Only {item.stock} left!
            </span>
          )}
          
          <div className="flex flex-col items-end">
            <span className="font-mono text-lg font-bold text-[var(--color-accent)]">
              {formatPrice(item.price * item.quantity)}
            </span>
            {item.quantity > 1 && (
              <span className="text-[10px] text-[var(--color-muted)]">
                {formatPrice(item.price)} each
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
