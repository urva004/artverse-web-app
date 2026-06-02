// ═══════════════════════════════════════════════════
// ArtVerse — Artist Card Component
// ═══════════════════════════════════════════════════

"use client";

import { motion } from "framer-motion";
import { Users, Package } from "lucide-react";
import Link from "next/link";

import { UserAvatar } from "@/components/UserAvatar";

interface ArtistCardProps {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  followerCount: number;
  productCount: number;
  index?: number;
}

export function ArtistCard({
  id,
  name,
  avatar,
  bio,
  followerCount,
  productCount,
  index = 0,
}: ArtistCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link href={`/artists/${id}`}>
        <div className="group relative overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
          {/* Gradient accent line */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-teal)] opacity-0 transition-opacity group-hover:opacity-100" />

          {/* Avatar */}
          <UserAvatar
            name={name}
            avatar={avatar}
            className="mx-auto mb-4 h-20 w-20 border-2 border-[var(--color-accent)]/20 transition-all group-hover:border-[var(--color-accent)]/50 group-hover:shadow-glow"
            textClassName="text-lg font-bold"
          />

          {/* Name */}
          <h3 className="mb-1 font-display text-lg font-bold text-[var(--color-text)]">
            {name}
          </h3>

          {/* Bio */}
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[var(--color-muted)]">
            {bio || "Artist on ArtVerse"}
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
              <Users size={14} />
              <span className="font-semibold text-[var(--color-text)]">
                {followerCount}
              </span>{" "}
              followers
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
              <Package size={14} />
              <span className="font-semibold text-[var(--color-text)]">
                {productCount}
              </span>{" "}
              works
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
