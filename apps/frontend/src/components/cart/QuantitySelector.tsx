"use client";

import { Minus, Plus, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

interface QuantitySelectorProps {
  productId: string;
  initialQuantity: number;
  stock: number;
}

export function QuantitySelector({ 
  productId, 
  initialQuantity, 
  stock 
}: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateQuantity } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedUpdate = useCallback(
    (newQty: number) => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(async () => {
        setIsUpdating(true);

        try {
          await updateQuantity(productId, newQty, isAuthenticated);
        } finally {
          setIsUpdating(false);
        }
      }, 500);
    },
    [productId, isAuthenticated, updateQuantity]
  );

  const handleIncrement = () => {
    if (quantity < stock) {
      const newQty = quantity + 1;
      setQuantity(newQty);
      debouncedUpdate(newQty);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      const newQty = quantity - 1;
      setQuantity(newQty);
      debouncedUpdate(newQty);
    }
  };

  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-1">
        <button
          onClick={handleDecrement}
          disabled={quantity <= 1 || isUpdating}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-text)] disabled:opacity-30"
        >
          <Minus size={14} />
        </button>
        
        <div className="relative flex w-8 items-center justify-center">
          {isUpdating ? (
            <Loader2 size={12} className="animate-spin text-[var(--color-accent)]" />
          ) : (
            <span className="text-sm font-medium">{quantity}</span>
          )}
        </div>

        <button
          onClick={handleIncrement}
          disabled={quantity >= stock || isUpdating}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-text)] disabled:opacity-30"
        >
          <Plus size={14} />
        </button>
      </div>
      
      {quantity >= stock && (
        <span className="text-[10px] text-[var(--color-rose)] font-medium">
          Limit reached
        </span>
      )}
    </div>
  );
}
