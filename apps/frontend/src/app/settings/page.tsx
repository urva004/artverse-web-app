"use client";

import { motion } from "framer-motion";
import { User, Camera, Save, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

import { changePasswordSchema, type ChangePasswordInput, UserRole } from "@artverse/utils";

import { api, toastApiError } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { UserAvatar } from "@/components/UserAvatar";

interface ProfileForm {
  name: string;
  bio: string;
  socialLinks: { instagram?: string; twitter?: string; website?: string };
}

export default function SettingsPage() {
  const { user, isAuthenticated, fetchMe, setUser, clearSession } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isSellerLoading, setIsSellerLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || "",
      bio: (user as any)?.bio || "",
      socialLinks: ((user as any)?.socialLinks as Record<string, string>) || {},
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // Redirect to login only after hydration check
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    reset({
      name: user?.name || "",
      bio: (user as any)?.bio || "",
      socialLinks: ((user as any)?.socialLinks as Record<string, string>) || {},
    });
  }, [reset, user]);

  if (!isAuthenticated) {
    return null;
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    avatarFileRef.current = file;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.bio) formData.append("bio", data.bio);

      // Clean socialLinks: remove empty strings so they don't fail URL validation
      if (data.socialLinks) {
        const cleaned: Record<string, string> = {};
        for (const [key, value] of Object.entries(data.socialLinks)) {
          if (value && value.trim() !== "") {
            cleaned[key] = value.trim();
          }
        }
        if (Object.keys(cleaned).length > 0) {
          formData.append("socialLinks", JSON.stringify(cleaned));
        }
      }

      if (avatarFileRef.current)
        formData.append("avatar", avatarFileRef.current);

      // The request interceptor auto-handles FormData Content-Type
      const response = await api.put("/users/me", formData);
      const updatedUser = response.data.data;
      setUser(updatedUser);
      await fetchMe();
      queryClient.invalidateQueries({ queryKey: ["artist", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["artist-products", user?.id] });
      toast.success("Profile updated! 🎨");
      avatarFileRef.current = null;
      setAvatarPreview(null);
      router.replace(`/artist/${updatedUser.id}`);
    } catch (err: any) {
      console.error("Profile update error:", err?.response?.data || err);
      toastApiError(err, "Failed to update profile");
    }
    setIsLoading(false);
  };

  const handleBecomeSeller = async () => {
    setIsSellerLoading(true);
    try {
      const response = await api.post("/auth/onboarding", {
        role: UserRole.SELLER,
      });

      const updatedUser = response.data.data.user;
      setUser(updatedUser);
      await fetchMe();
      queryClient.invalidateQueries({ queryKey: ["artist", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["artist-products", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["seller-dashboard"] });

      toast.success("Seller access enabled. You can upload artwork now.");
    } catch (err: any) {
      toastApiError(err, "Failed to enable seller access");
    } finally {
      setIsSellerLoading(false);
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    setIsPasswordLoading(true);
    try {
      await api.post("/auth/change-password", data);
      clearSession();
      resetPassword();
      toast.success("Password updated. Please sign in again.");
      router.push("/auth/login");
    } catch (err: any) {
      toastApiError(err, "Failed to update password");
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="mb-2 font-display text-display-sm">
          Profile <span className="gradient-text">Settings</span>
        </h1>
        <p className="mb-8 text-sm text-[var(--color-muted)]">
          Update your profile information
        </p>

        <div className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div
                onClick={() => avatarRef.current?.click()}
                className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border-2 border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 transition hover:border-[var(--color-accent)]/50"
              >
                <UserAvatar
                  name={user?.name || "User"}
                  avatar={avatarPreview || user?.avatar || null}
                  className="h-24 w-24"
                  textClassName="text-xl font-bold"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                  <Camera size={20} className="text-white" />
                </div>
              </div>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-xs text-[var(--color-muted)]">
                Click to change avatar
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <input
                type="text"
                {...register("name", { required: "Name is required" })}
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm focus:border-[var(--color-accent)] focus:outline-none"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-[var(--color-rose)]">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Bio</label>
              <textarea
                {...register("bio")}
                rows={3}
                placeholder="Tell us about yourself..."
                className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>

            {/* Social Links */}
            <div>
              <label className="mb-3 block text-sm font-medium">
                Social Links
              </label>
              <div className="space-y-3">
                {["instagram", "twitter", "website"].map((platform) => (
                  <div key={platform}>
                    <label className="mb-1 block text-xs capitalize text-[var(--color-muted)]">
                      {platform}
                    </label>
                    <input
                      type="text"
                      {...register(
                        `socialLinks.${platform as "instagram" | "twitter" | "website"}`,
                      )}
                      placeholder={`https://${platform}.com/...`}
                      className="h-10 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm text-[var(--color-muted)] opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-input bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-teal)] text-sm font-semibold text-white shadow-glow hover:shadow-glow-md disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold">
                {user?.role === UserRole.BUYER ? "Become a Seller" : "Seller Access"}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {user?.role === UserRole.BUYER
                  ? "Upgrade your account to upload artworks and manage a seller dashboard."
                  : "Your seller access is already active."}
              </p>
            </div>
            <span className="rounded-pill bg-[var(--color-bg)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              {user?.role || "BUYER"}
            </span>
          </div>

          {user?.role === UserRole.BUYER ? (
            <button
              type="button"
              onClick={handleBecomeSeller}
              disabled={isSellerLoading}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-input bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-teal)] text-sm font-semibold text-white shadow-glow hover:shadow-glow-md disabled:opacity-50"
            >
              {isSellerLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "Become a Seller"
              )}
            </button>
          ) : (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.replace("/dashboard")}
                className="flex h-11 flex-1 items-center justify-center rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-semibold transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Open Dashboard
              </button>
              <button
                type="button"
                onClick={() => router.replace(`/artist/${user?.id}`)}
                className="flex h-11 flex-1 items-center justify-center rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-semibold transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                View Profile
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
              <Lock size={18} />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Change Password</h2>
              <p className="text-xs text-[var(--color-muted)]">
                Use a new password with 1 uppercase, 1 lowercase, and a maximum of 8 characters.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Current Password</label>
              <input
                type="password"
                {...registerPassword("currentPassword")}
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm focus:border-[var(--color-accent)] focus:outline-none"
              />
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-xs text-[var(--color-rose)]">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">New Password</label>
              <input
                type="password"
                {...registerPassword("newPassword")}
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm focus:border-[var(--color-accent)] focus:outline-none"
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-xs text-[var(--color-rose)]">
                  {passwordErrors.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Confirm New Password</label>
              <input
                type="password"
                {...registerPassword("confirmNewPassword")}
                className="h-11 w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm focus:border-[var(--color-accent)] focus:outline-none"
              />
              {passwordErrors.confirmNewPassword && (
                <p className="mt-1 text-xs text-[var(--color-rose)]">
                  {passwordErrors.confirmNewPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPasswordLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] text-sm font-semibold transition hover:border-[var(--color-accent)] disabled:opacity-50"
            >
              {isPasswordLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
              ) : (
                <>Update Password</>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
