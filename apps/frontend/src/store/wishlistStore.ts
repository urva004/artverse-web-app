// ═══════════════════════════════════════════════════
// ArtVerse — Wishlist Zustand Store
// ═══════════════════════════════════════════════════

import { create } from "zustand";
import toast from "react-hot-toast";

import { api } from "../lib/api";

interface WishlistState {
  /** Set of wishlisted product IDs for fast lookup */
  wishlistedIds: Set<string>;
  /** Per-product loading state for optimistic UI */
  loadingIds: Set<string>;
  /** Whether the initial fetch has completed */
  isInitialized: boolean;

  // Actions
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  setInitialWishlistState: (productId: string, wishlisted: boolean) => void;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  wishlistedIds: new Set<string>(),
  loadingIds: new Set<string>(),
  isInitialized: false,

  fetchWishlist: async () => {
    try {
      const response = await api.get("/wishlist?limit=50");
      const items = response.data.data ?? [];
      const ids = new Set<string>(items.map((item: any) => item.product.id));
      set({ wishlistedIds: ids, isInitialized: true });
    } catch {
      // Silently fail — user may not be authenticated
      set({ isInitialized: true });
    }
  },

  toggleWishlist: async (productId: string) => {
    const { wishlistedIds, loadingIds } = get();

    // Prevent double-clicking
    if (loadingIds.has(productId)) return;

    const wasWishlisted = wishlistedIds.has(productId);

    // Optimistic update
    const newIds = new Set(wishlistedIds);
    if (wasWishlisted) {
      newIds.delete(productId);
    } else {
      newIds.add(productId);
    }

    const newLoading = new Set(loadingIds);
    newLoading.add(productId);

    set({ wishlistedIds: newIds, loadingIds: newLoading });

    try {
      await api.post(`/wishlist/${productId}`);
      toast.success(wasWishlisted ? "Removed from wishlist" : "Added to wishlist");
    } catch {
      // Rollback on error
      const rollbackIds = new Set(get().wishlistedIds);
      if (wasWishlisted) {
        rollbackIds.add(productId);
      } else {
        rollbackIds.delete(productId);
      }
      set({ wishlistedIds: rollbackIds });
      toast.error("Failed to update wishlist");
    } finally {
      const updatedLoading = new Set(get().loadingIds);
      updatedLoading.delete(productId);
      set({ loadingIds: updatedLoading });
    }
  },

  isWishlisted: (productId: string) => {
    return get().wishlistedIds.has(productId);
  },

  setInitialWishlistState: (productId: string, wishlisted: boolean) => {
    const newIds = new Set(get().wishlistedIds);
    if (wishlisted) {
      newIds.add(productId);
    } else {
      newIds.delete(productId);
    }
    set({ wishlistedIds: newIds });
  },
}));
