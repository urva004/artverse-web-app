// ═══════════════════════════════════════════════════
// ArtVerse — Cart Zustand Store (Synced with Backend)
// ═══════════════════════════════════════════════════

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";
import type { CartItem } from "@artverse/utils";
import toast from "react-hot-toast";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (item: CartItem, isAuthenticated: boolean) => Promise<void>;
  removeItem: (productId: string, isAuthenticated: boolean) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, isAuthenticated: boolean) => Promise<void>;
  toggleSaveForLater: (productId: string, save: boolean, isAuthenticated: boolean) => Promise<void>;
  clearCart: (isAuthenticated: boolean) => Promise<void>;
  syncGuestCart: (userId: string) => Promise<void>;
  updateStock: (productId: string, newStock: number) => void;
  toggleCart: () => void;
  clearCartState: () => void;

  // Computed
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isLoading: false,

      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const response = await api.get("/cart");
          const { cart } = response.data.data;
          
          const mappedItems = cart.items.map((item: any) => ({
            productId: item.productId,
            title: item.product.title,
            price: item.product.price,
            image: item.product.images[0],
            quantity: item.quantity,
            stock: item.product.stock,
            sellerName: item.product.seller.name,
            isSavedForLater: item.isSavedForLater,
          }));
          
          set({ items: mappedItems });
        } catch (error) {
          console.error("Failed to fetch cart:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      addItem: async (item: CartItem, isAuthenticated: boolean) => {
        const currentItems = get().items;
        const existing = currentItems.find((i) => i.productId === item.productId);

        // Optimistic UI Update
        let newItems;
        if (existing) {
          const newQuantity = Math.min(existing.quantity + item.quantity, item.stock);
          newItems = currentItems.map((i) =>
            i.productId === item.productId 
              ? { ...i, quantity: newQuantity, isSavedForLater: false } 
              : i
          );
        } else {
          newItems = [...currentItems, { ...item, isSavedForLater: false }];
        }
        set({ items: newItems });

        if (isAuthenticated) {
          try {
            await api.post("/cart/items", {
              productId: item.productId,
              quantity: item.quantity,
            });
          } catch (error) {
            set({ items: currentItems });
            toast.error("Failed to add to cart");
          }
        }
      },

      removeItem: async (productId: string, isAuthenticated: boolean) => {
        const currentItems = get().items;
        set({ items: currentItems.filter((i) => i.productId !== productId) });

        if (isAuthenticated) {
          try {
            await api.delete(`/cart/items/${productId}`);
          } catch (error) {
            set({ items: currentItems });
            toast.error("Failed to remove item");
          }
        }
      },

      updateQuantity: async (productId: string, quantity: number, isAuthenticated: boolean) => {
        if (quantity <= 0) {
          return get().removeItem(productId, isAuthenticated);
        }

        const currentItems = get().items;
        const item = currentItems.find((i) => i.productId === productId);
        if (!item) return;

        const newQuantity = Math.min(quantity, item.stock);
        set({
          items: currentItems.map((i) =>
            i.productId === productId ? { ...i, quantity: newQuantity } : i
          ),
        });

        if (isAuthenticated) {
          try {
            await api.patch(`/cart/items/${productId}`, { quantity: newQuantity });
          } catch (error) {
            set({ items: currentItems });
            toast.error("Failed to update quantity");
          }
        }
      },

      toggleSaveForLater: async (productId: string, save: boolean, isAuthenticated: boolean) => {
        const currentItems = get().items;
        
        // Optimistic UI Update
        set({
          items: currentItems.map((i) =>
            i.productId === productId ? { ...i, isSavedForLater: save } : i
          ),
        });

        if (isAuthenticated) {
          try {
            await api.patch(`/cart/items/${productId}/save`, { save });
          } catch (error) {
            set({ items: currentItems });
            toast.error("Failed to update save status");
          }
        } else {
          // Local storage only support for Save for Later? 
          // For now, keep it in state/localStorage as well.
        }
      },

      clearCart: async (isAuthenticated: boolean) => {
        const currentItems = get().items;
        // Only clear items NOT saved for later when doing a general clear?
        // Or clear everything? Amazon clears only active items.
        // Let's clear only active items (isSavedForLater: false)
        const activeItems = currentItems.filter(i => !i.isSavedForLater);
        const savedItems = currentItems.filter(i => i.isSavedForLater);
        
        set({ items: savedItems });

        if (isAuthenticated) {
          try {
            // Backend clearCart usually clears everything. 
            // We might need to adjust backend if we want to keep saved items.
            // For now, let's assume clearCart clears all.
            await api.delete("/cart");
            set({ items: [] });
          } catch (error) {
            set({ items: currentItems });
            toast.error("Failed to clear cart");
          }
        }
      },

      syncGuestCart: async (userId: string) => {
        const guestItems = get().items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));

        if (guestItems.length === 0) {
          await get().fetchCart();
          return;
        }

        try {
          const response = await api.post("/cart/sync", { items: guestItems });
          const { cart } = response.data.data;
          
          const mappedItems = cart.items.map((item: any) => ({
            productId: item.productId,
            title: item.product.title,
            price: item.product.price,
            image: item.product.images[0],
            quantity: item.quantity,
            stock: item.product.stock,
            sellerName: item.product.seller.name,
            isSavedForLater: item.isSavedForLater,
          }));
          
          set({ items: mappedItems });
        } catch (error) {
          console.error("Failed to sync cart:", error);
          await get().fetchCart();
        }
      },

      updateStock: (productId: string, newStock: number) => {
        const currentItems = get().items;
        const exists = currentItems.some(i => i.productId === productId);
        if (!exists) return;

        set({
          items: currentItems.map(i => 
            i.productId === productId ? { ...i, stock: newStock } : i
          )
        });

        // Show toast if stock becomes 0
        if (newStock === 0) {
          const item = currentItems.find(i => i.productId === productId);
          if (item && !item.isSavedForLater) {
            toast.error(`"${item.title}" is now out of stock!`, { id: `stock-${productId}` });
          }
        }
      },

      toggleCart: () => {
        set({ isOpen: !get().isOpen });
      },

      clearCartState: () => {
        set({ items: [], isOpen: false, isLoading: false });
      },

      totalItems: () => {
        return get().items
          .filter(i => !i.isSavedForLater)
          .reduce((sum, item) => sum + item.quantity, 0);
      },

      totalPrice: () => {
        return get().items
          .filter(i => !i.isSavedForLater)
          .reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );
      },
    }),
    {
      name: "artverse-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
