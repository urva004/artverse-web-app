"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowLeft, Trash2, Loader2, Bookmark } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { api } from "@/lib/api";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { 
    items, 
    isLoading, 
    fetchCart,
    clearCart, 
    totalItems 
  } = useCartStore();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Sync or fetch cart on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      void fetchCart();
    }
  }, [fetchCart, isAuthenticated, user]);

  // Separate items into active and saved
  const activeItems = useMemo(() => items.filter(i => !i.isSavedForLater), [items]);
  const savedItems = useMemo(() => items.filter(i => i.isSavedForLater), [items]);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to proceed to checkout");
      router.push(`/auth/login?redirect=/cart`);
      return;
    }

    if (activeItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsCheckingOut(true);
    try {
      const orderItems = activeItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));

      const response = await api.post("/orders", { items: orderItems });
      const { razorpayOrder } = response.data.data;

      const rzp = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.id,
        name: "ArtVerse",
        description: "Art Purchase",
        handler: async (response: any) => {
          try {
            await api.post("/orders/verify", response);
            await clearCart(true);
            toast.success("Payment successful! 🎉");
            router.push("/orders/my");
          } catch {
            toast.error("Payment verification failed");
          }
        },
        theme: { color: "#c77dff" },
      });
      rzp.open();
    } catch (error) {
      console.error(error);
      toast.error("Failed to initiate checkout");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--color-accent)]" />
          <p className="text-sm font-medium text-[var(--color-muted)]">Loading your masterpieces...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-[var(--color-card)]"
        >
          <div className="absolute inset-0 animate-pulse rounded-full bg-[var(--color-accent-soft)]" />
          <ShoppingBag size={48} className="relative text-[var(--color-accent)]" />
        </motion.div>
        
        <h2 className="mb-3 font-display text-2xl font-bold md:text-3xl">Your cart is empty</h2>
        <p className="mb-8 text-base text-[var(--color-muted)]">
          Looks like you haven't added any artwork to your collection yet.
          Explore our curated marketplace to find something you love.
        </p>
        
        <Link
          href="/marketplace"
          className="group flex items-center gap-2 rounded-xl bg-[var(--color-accent)] px-8 py-4 text-sm font-bold text-white shadow-glow transition-all hover:shadow-glow-md"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          Browse Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            Shopping <span className="gradient-text">Cart</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            You have <span className="font-semibold text-[var(--color-text)]">{activeItems.length} items</span> in your cart
          </p>
        </div>
        
        <button
          onClick={() => clearCart(isAuthenticated)}
          className="flex items-center gap-2 text-xs font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-rose)]"
        >
          <Trash2 size={14} />
          Clear Cart
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-12">
        {/* Cart Items List */}
        <div className="lg:col-span-8">
          <div className="space-y-4">
            {activeItems.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {activeItems.map((item, index) => (
                  <CartItem key={item.productId} item={item} index={index} />
                ))}
              </AnimatePresence>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] p-12 text-center">
                <ShoppingBag size={40} className="mb-4 text-[var(--color-muted)] opacity-20" />
                <p className="text-sm text-[var(--color-muted)]">No active items in your cart</p>
                <Link href="/marketplace" className="mt-4 text-sm font-bold text-[var(--color-accent)]">
                  Shop now
                </Link>
              </div>
            )}
          </div>
          
          {/* Saved for Later Section */}
          {savedItems.length > 0 && (
            <div className="mt-16">
              <div className="mb-6 flex items-center gap-2">
                <Bookmark size={20} className="text-[var(--color-accent)]" />
                <h2 className="font-display text-xl font-bold">Saved for Later</h2>
                <span className="rounded-full bg-[var(--color-card)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-muted)]">
                  {savedItems.length}
                </span>
              </div>
              
              <div className="space-y-4 opacity-80 transition-opacity hover:opacity-100">
                <AnimatePresence mode="popLayout">
                  {savedItems.map((item, index) => (
                    <CartItem key={item.productId} item={item} index={index + activeItems.length} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-soft)]"
            >
              <ArrowLeft size={16} />
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <CartSummary 
            onCheckout={handleCheckout} 
            isLoading={isCheckingOut} 
          />
        </div>
      </div>
    </div>
  );
}
