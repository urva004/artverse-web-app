"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useSocket } from "@/providers/SocketProvider";

export function CartInitializer() {
  const { isAuthenticated, user } = useAuthStore();
  const { syncGuestCart, fetchCart, updateStock, clearCartState } = useCartStore();
  const { socket } = useSocket();
  const prevAuth = useRef(isAuthenticated);

  useEffect(() => {
    // Initial load: validate session cart state from the server when authenticated.
    if (isAuthenticated && user) {
      void fetchCart();
    }
  }, [fetchCart, isAuthenticated, user]);

  useEffect(() => {
    if (!socket) return;

    const handleStockUpdate = (data: { productId: string; newStock: number }) => {
      updateStock(data.productId, data.newStock);
    };

    socket.on("stock:update", handleStockUpdate);

    return () => {
      socket.off("stock:update", handleStockUpdate);
    };
  }, [socket, updateStock]);

  useEffect(() => {
    // Detect login transition and merge any guest cart items once.
    if (isAuthenticated && !prevAuth.current && user) {
      syncGuestCart(user.id);
    }

    if (!isAuthenticated && prevAuth.current) {
      clearCartState();
    } 
    
    prevAuth.current = isAuthenticated;
  }, [clearCartState, isAuthenticated, user, syncGuestCart]);

  return null; // This component doesn't render anything
}
