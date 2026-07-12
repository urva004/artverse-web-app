"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Brush } from "lucide-react";
import toast from "react-hot-toast";

import { api, toastApiError } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { UserRole } from "@artverse/utils";

const OPTIONS = [
  {
    role: UserRole.BUYER,
    title: "Explore as a buyer",
    description: "Discover artworks, save favorites, and connect with artists.",
    icon: ShoppingBag,
  },
  {
    role: UserRole.SELLER,
    title: "Continue as a seller",
    description: "Upload artwork, manage your portfolio, and sell to collectors.",
    icon: Brush,
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role ?? UserRole.BUYER);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user?.role) {
      setSelectedRole(user.role);
    }
  }, [user?.role]);

  useEffect(() => {
    if (mounted && user?.role === UserRole.ADMIN) {
      router.replace("/dashboard");
    }
  }, [mounted, router, user?.role]);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, isLoading, mounted, router]);

  const handleContinue = async () => {
    setIsSaving(true);
    try {
      const response = await api.post("/auth/onboarding", {
        role: selectedRole,
      });

      const updatedUser = response.data.data.user;
      setUser(updatedUser);

      toast.success("Profile choice saved");
      router.replace(
        selectedRole === UserRole.SELLER ? "/dashboard" : "/marketplace",
      );
    } catch (error: unknown) {
      toastApiError(error, "Unable to save onboarding choice");
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted || isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  if (user?.role === UserRole.ADMIN) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center px-4 py-10">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="mb-3 font-display text-display-sm">
            Choose your <span className="gradient-text">starting point</span>
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-[var(--color-muted)]">
            ArtVerse tailors the first experience based on how you want to use the platform.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
          {OPTIONS.map((option) => {
            const active = selectedRole === option.role;
            return (
              <motion.button
                key={option.role}
                type="button"
                whileHover={{ y: -2 }}
                onClick={() => setSelectedRole(option.role)}
                className={`rounded-card border p-6 text-left transition-all ${
                  active
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 shadow-glow"
                    : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)]/40"
                }`}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-card bg-[var(--color-bg)]">
                  <option.icon size={22} className="text-[var(--color-accent)]" />
                </div>
                <h2 className="mb-2 font-display text-xl font-bold">{option.title}</h2>
                <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                  {option.description}
                </p>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.replace("/marketplace")}
            className="rounded-pill border border-[var(--color-border)] px-6 py-2.5 text-sm font-semibold text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-pill bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-teal)] px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:shadow-glow-md disabled:opacity-50"
          >
            {isSaving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <ArrowRight size={16} />
            )}
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}