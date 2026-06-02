"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  User,
  Users,
  Package,
  Calendar,
  Heart,
  MessageSquare,
  ExternalLink,
  Upload,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { formatDate } from "@artverse/utils";
import { ProductCard } from "@/components/ProductCard";
import {
  TextSkeleton,
  AvatarSkeleton,
  ProductGridSkeleton,
} from "@/components/SkeletonLoader";
import { UserAvatar } from "@/components/UserAvatar";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function ArtistProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user: me } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: artist, isLoading } = useQuery({
    queryKey: ["artist", id],
    queryFn: async () => {
      const r = await api.get(`/users/${id}`);
      return r.data.data;
    },
    enabled: !!id,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["artist-products", id],
    queryFn: async () => {
      const r = await api.get(`/products?sellerId=${id}`);
      return r.data;
    },
    enabled: !!id,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const r = await api.post(`/users/${id}/follow`);
      return r.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["artist", id] });
      toast.success(data.followed ? "Following!" : "Unfollowed");
    },
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <AvatarSkeleton size="h-28 w-28" />
          <TextSkeleton width="w-48" height="h-8" />
          <TextSkeleton width="w-64" />
          <div className="flex gap-6">
            <TextSkeleton width="w-20" />
            <TextSkeleton width="w-20" />
            <TextSkeleton width="w-20" />
          </div>
        </div>
      </div>
    );

  if (!artist)
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <h2 className="font-display text-xl">Artist not found</h2>
        <Link
          href="/artists"
          className="rounded-pill bg-[var(--color-accent)] px-6 py-2 text-sm font-semibold text-white"
        >
          Browse Artists
        </Link>
      </div>
    );

  const products = productsData?.data ?? [];
  const isOwnProfile = me?.id === id;
  const socialLinks = (artist.socialLinks as Record<string, string>) || {};

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        {/* Avatar */}
        <UserAvatar
          name={artist.name}
          avatar={artist.avatar}
          className="mx-auto mb-5 h-28 w-28 border-3 border-[var(--color-accent)]/30 shadow-glow"
          textClassName="text-2xl font-bold"
        />

        <h1 className="mb-2 font-display text-display-sm">{artist.name}</h1>

        {artist.bio && (
          <p className="mx-auto mb-5 max-w-lg text-[var(--color-muted)]">
            {artist.bio}
          </p>
        )}

        {/* Stats */}
        <div className="mb-6 flex justify-center gap-8">
          <div className="text-center">
            <p className="font-display text-xl font-bold">
              {artist.followerCount}
            </p>
            <p className="text-xs text-[var(--color-muted)]">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl font-bold">
              {artist.followingCount}
            </p>
            <p className="text-xs text-[var(--color-muted)]">Following</p>
          </div>
          <div className="text-center">
            <p className="font-display text-xl font-bold">
              {artist.productCount}
            </p>
            <p className="text-xs text-[var(--color-muted)]">Works</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          {!isOwnProfile && isAuthenticated && (
            <>
              <Link
                href={`/messages/${artist.id}`}
                className="inline-flex items-center gap-1.5 rounded-pill border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                <MessageSquare size={16} />
                Message
              </Link>
              <button
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className={`rounded-pill px-8 py-2.5 text-sm font-semibold transition-all ${
                  artist.isFollowing
                    ? "border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-rose)] hover:text-[var(--color-rose)]"
                    : "bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] text-white shadow-glow hover:shadow-glow-md"
                }`}
              >
                {artist.isFollowing ? "Following" : "Follow"}
              </button>
            </>
          )}
          {isOwnProfile && (
            <>
              <Link
                href="/settings"
                className="rounded-pill border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium hover:border-[var(--color-accent)]"
              >
                Edit Profile
              </Link>
              {(me?.role === "SELLER" || me?.role === "ADMIN") && (
                <Link
                  href="/dashboard/upload"
                  className="flex items-center gap-1.5 rounded-pill bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-6 py-2.5 text-sm font-semibold text-white shadow-glow hover:shadow-glow-md"
                >
                  <Upload size={16} />
                  Upload Artwork
                </Link>
              )}
            </>
          )}
        </div>

        {/* Social Links */}
        {Object.keys(socialLinks).length > 0 && (
          <div className="mt-5 flex justify-center gap-3">
            {Object.entries(socialLinks).map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-pill border border-[var(--color-border)] px-4 py-1.5 text-xs text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                <ExternalLink size={12} />
                {platform}
              </a>
            ))}
          </div>
        )}

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[var(--color-muted)]">
          <Calendar size={12} /> Joined {formatDate(artist.createdAt)}
        </p>
      </motion.div>

      {/* Portfolio Grid */}
      <div>
        <h2 className="mb-6 font-display text-xl font-bold">
          Portfolio{" "}
          <span className="text-[var(--color-muted)]">({products.length})</span>
        </h2>
        {productsLoading && <ProductGridSkeleton count={6} />}
        {!productsLoading && products.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Package size={32} className="text-[var(--color-muted)]" />
            <p className="text-[var(--color-muted)]">No artworks yet</p>
          </div>
        )}
        {!productsLoading && products.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p: any, i: number) => (
              <ProductCard key={p.id} {...p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
