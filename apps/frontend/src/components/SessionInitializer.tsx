"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

export function SessionInitializer() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const clearSession = useAuthStore((state) => state.clearSession);
  const clearCartState = useCartStore((state) => state.clearCartState);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken && isAuthenticated) {
      clearSession();
      clearCartState();
      return;
    }

    if (accessToken) {
      void fetchMe();
    }
  }, [clearCartState, clearSession, fetchMe, isAuthenticated]);

  return null;
}