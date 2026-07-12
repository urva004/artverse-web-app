// ═══════════════════════════════════════════════════
// ArtVerse — Register Page
// ═══════════════════════════════════════════════════

"use client";

import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { registerSchema, type RegisterInput } from "@artverse/utils";

import { useAuthStore } from "@/store/authStore";
import { toastApiError } from "@/lib/api";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await registerUser(data.name, data.email, data.password);
      toast.success("Welcome to ArtVerse! 🎨");
      const currentUser = useAuthStore.getState().user;
      router.push(currentUser?.role === "ADMIN" ? "/dashboard" : "/onboarding");
    } catch (error: unknown) {
      toastApiError(error, "Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-40 top-20 h-80 w-80 rounded-full bg-[var(--color-teal)] opacity-5 blur-[100px]" />
        <div className="absolute -left-20 bottom-20 h-60 w-60 rounded-full bg-[var(--color-accent)] opacity-5 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-display text-display-sm">
            Join <span className="gradient-text">ArtVerse</span>
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            Create your account and start your art journey
          </p>
        </div>

        <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Full Name
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                />
                <input
                  type="text"
                  placeholder="Your name"
                  {...register("name")}
                  className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] pl-10 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] transition-colors focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-[var(--color-rose)]">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                />
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] pl-10 pr-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] transition-colors focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-[var(--color-rose)]">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="1 upper, 1 lower, max 8"
                  {...register("password")}
                  className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] pl-10 pr-10 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] transition-colors focus:border-[var(--color-accent)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-[var(--color-rose)]">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-input bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-teal)] text-sm font-semibold text-white shadow-glow transition-all hover:shadow-glow-md disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-[var(--color-accent)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
