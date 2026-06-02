"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Plus, MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ProductGridSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function CommunityPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | "my">("all");
  const { isAuthenticated } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["groups", search, tab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (tab === "my") params.set("my", "true");
      const r = await api.get(`/groups?${params}`);
      return r.data;
    },
  });

  const groups = data?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-1 font-display text-display-sm">
            <span className="gradient-text">Community</span>
          </h1>
          <p className="text-[var(--color-muted)]">
            Join groups, share ideas, and connect with artists
          </p>
        </motion.div>
        {isAuthenticated && (
          <Link
            href="/community/create"
            className="flex items-center gap-2 rounded-pill bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-teal)] px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:shadow-glow-md"
          >
            <Plus size={16} /> Create Group
          </Link>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchBar
          placeholder="Search groups..."
          onSearch={setSearch}
          className="flex-1 max-w-md"
        />
        {isAuthenticated && (
          <div className="flex rounded-pill border border-[var(--color-border)] p-1">
            {(["all", "my"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-pill px-4 py-1.5 text-sm font-medium transition ${tab === t ? "bg-[var(--color-accent)] text-white" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"}`}
              >
                {t === "all" ? "All Groups" : "My Groups"}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && <ProductGridSkeleton count={6} />}

      {!isLoading && groups.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-card)]">
            <Users size={28} className="text-[var(--color-muted)]" />
          </div>
          <h3 className="font-display text-lg font-bold">No groups found</h3>
          <p className="text-sm text-[var(--color-muted)]">
            {tab === "my"
              ? "You haven't joined any groups yet"
              : "Be the first to create one!"}
          </p>
        </div>
      )}

      {!isLoading && groups.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group: any, i: number) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/community/${group.id}`}>
                <div className="group rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6 transition-all hover:-translate-y-1 hover:shadow-card-hover">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-card bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-teal)]/20">
                    <Users size={24} className="text-[var(--color-accent)]" />
                  </div>
                  <h3 className="mb-1 font-display text-lg font-bold">
                    {group.name}
                  </h3>
                  <p className="mb-4 line-clamp-2 text-sm text-[var(--color-muted)]">
                    {group.description || "A community group"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {group.memberCount} members
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} /> {group.messageCount} msgs
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`rounded-pill px-2.5 py-0.5 text-[10px] font-medium ${group.type === "PUBLIC" ? "bg-[var(--color-teal)]/10 text-[var(--color-teal)]" : "bg-[var(--color-gold)]/10 text-[var(--color-gold)]"}`}
                    >
                      {group.type}
                    </span>
                    <span className="text-[10px] text-[var(--color-muted)]">
                      by {group.creator.name}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
