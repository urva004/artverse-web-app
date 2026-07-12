// ═══════════════════════════════════════════════════
// ArtVerse — API Client (Axios)
// ═══════════════════════════════════════════════════

import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import toast from "react-hot-toast";

import type { ApiError } from "@artverse/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
  withCredentials: true,
});

// ── Request Interceptor: Attach JWT + handle FormData ──
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // When sending FormData, delete the Content-Type header so the browser
    // can set it automatically with the correct multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle 401 + refresh ──
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== "undefined"
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          clearAuth();
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken },
          { withCredentials: true }
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data.tokens;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch {
        clearAuth();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

let isClearing = false;

function clearAuth(): void {
  if (typeof window === "undefined" || isClearing) return;
  isClearing = true;

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  // Clear the zustand persisted auth store to prevent rehydrating isAuthenticated: true
  localStorage.removeItem("artverse-auth");
  localStorage.removeItem("artverse-cart");

  // Only redirect if not already on an auth page (prevents infinite reload loop)
  if (!window.location.pathname.startsWith("/auth")) {
    window.location.href = "/auth/login";
  }

  // Reset the flag after a short delay
  setTimeout(() => { isClearing = false; }, 1000);
}

/**
 * Cleanly formats and toasts API errors, including Zod validation errors.
 */
export function toastApiError(error: any, fallbackMessage: string = "An error occurred") {
  const data = error?.response?.data;

  if (data) {
    // 1. If there are field-specific errors (e.g. from Zod validateBody)
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      data.errors.forEach((err: { field: string; message: string }) => {
        const fieldName = err.field.charAt(0).toUpperCase() + err.field.slice(1);
        toast.error(`${fieldName}: ${err.message}`);
      });
      return;
    }

    // 2. If there is a general error message from the backend
    if (data.message) {
      toast.error(data.message);
      return;
    }
  }

  // 3. Standard network/JS error message
  if (error?.message) {
    toast.error(error.message);
    return;
  }

  // 4. Fallback message
  toast.error(fallbackMessage);
}

export default api;
