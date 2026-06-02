// ═══════════════════════════════════════════════════
// ArtVerse — Auth Zustand Store
// ═══════════════════════════════════════════════════

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { UserPublic } from "@artverse/utils";

import { api } from "../lib/api";

interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: UserPublic | null) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post("/auth/login", { email, password });
          const { user, tokens } = response.data.data;

          localStorage.setItem("accessToken", tokens.accessToken);
          localStorage.setItem("refreshToken", tokens.refreshToken);

          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (
        name: string,
        email: string,
        password: string
      ) => {
        set({ isLoading: true });
        try {
          const response = await api.post("/auth/register", {
            name,
            email,
            password,
          });
          const { user, tokens } = response.data.data;

          localStorage.setItem("accessToken", tokens.accessToken);
          localStorage.setItem("refreshToken", tokens.refreshToken);

          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            await api.post("/auth/logout", { refreshToken });
          }
        } catch {
          // Proceed with logout even if API call fails
        }

        get().clearSession();
      },

      fetchMe: async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        set({ isLoading: true });
        try {
          const response = await api.get("/auth/me");
          set({
            user: response.data.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setUser: (user: UserPublic | null) => {
        set({ user, isAuthenticated: !!user });
      },

      clearSession: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("artverse-auth");
        localStorage.removeItem("artverse-cart");
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: "artverse-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
