"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, RefreshCcw } from "lucide-react";
import { formatPrice } from "@artverse/utils";
import { useCartStore } from "@/store/cartStore";

interface CartSummaryProps {
  onCheckout: () => void;
  isLoading?: boolean;
}

export function CartSummary({ onCheckout, isLoading }: CartSummaryProps) {
  const { totalPrice, totalItems } = useCartStore();
  const total = totalPrice();
  const count = totalItems();

  return (
    <div className="sticky top-24 space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm"
      >
        <h3 className="mb-6 font-display text-xl font-bold">
          Order Summary
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">Subtotal ({count} items)</span>
            <span className="font-medium">{formatPrice(total)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">Estimated Shipping</span>
            <span className="font-medium text-[var(--color-success)]">FREE</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">Tax</span>
            <span className="font-medium">Calculated at checkout</span>
          </div>

          <div className="my-4 border-t border-dashed border-[var(--color-border)]" />
          
          <div className="flex items-center justify-between">
            <span className="text-base font-bold">Total Amount</span>
            <div className="flex flex-col items-end">
              <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-teal)] bg-clip-text text-2xl font-bold text-transparent">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          <button
            onClick={onCheckout}
            disabled={isLoading || count === 0}
            className="group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-teal)] py-4 text-sm font-bold text-white shadow-glow transition-all hover:shadow-glow-md disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </span>
            ) : (
              <>
                Proceed to Checkout
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 gap-3 px-2">
        <div className="flex items-center gap-3 text-[11px] text-[var(--color-muted)]">
          <ShieldCheck size={16} className="text-[var(--color-success)]" />
          <span>Secure SSL encrypted payment</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--color-muted)]">
          <Truck size={16} className="text-[var(--color-accent)]" />
          <span>Free express shipping on all art</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--color-muted)]">
          <RefreshCcw size={16} className="text-[var(--color-teal)]" />
          <span>7-day easy return policy</span>
        </div>
      </div>
    </div>
  );
}
