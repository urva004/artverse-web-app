// ═══════════════════════════════════════════════════
// ArtVerse — Artists Discovery Page
// ═══════════════════════════════════════════════════

"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { useState } from "react";

import { ArtistCard } from "@/components/ArtistCard";
import { SearchBar } from "@/components/SearchBar";
import { ProductGridSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";

export default function ArtistsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["artists", search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      const r = await api.get(`/users/artists?${params}`);
      return r.data;
    },
  });

  const artists = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="mb-2 font-display text-display-sm">
          Discover <span className="gradient-text">Artists</span>
        </h1>
        <p className="text-[var(--color-muted)]">
          Connect with talented creators from around India
        </p>
      </motion.div>

      <div className="mb-8">
        <SearchBar
          placeholder="Search artists by name..."
          onSearch={(q) => {
            setSearch(q);
            setPage(1);
          }}
          className="max-w-xl"
        />
      </div>

      {isLoading && <ProductGridSkeleton count={8} />}

      {!isLoading && artists.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-card)]">
            <Users size={28} className="text-[var(--color-muted)]" />
          </div>
          <h3 className="font-display text-lg font-bold">No artists found</h3>
          <p className="text-sm text-[var(--color-muted)]">
            Try a different search term
          </p>
        </div>
      )}

      {!isLoading && artists.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {artists.map(
            (
              artist: {
                id: string;
                name: string;
                avatar: string | null;
                bio: string | null;
                followerCount: number;
                productCount: number;
              },
              i: number,
            ) => (
              <ArtistCard key={artist.id} {...artist} index={i} />
            ),
          )}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
            className="rounded-input border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-30"
          >
            Previous
          </button>
          <span className="px-4 text-sm text-[var(--color-muted)]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNext}
            className="rounded-input border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
