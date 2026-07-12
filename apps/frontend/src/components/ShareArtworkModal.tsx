"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Search, Send, User, Users, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { formatPrice, GroupType, UserRole } from "@artverse/utils";

import { UserAvatar } from "@/components/UserAvatar";
import { SafeImage } from "@/components/SafeImage";
import { api } from "@/lib/api";
import { normalizeImageSrc } from "@/lib/image";
import { useShareArtworkStore } from "@/store/shareArtworkStore";

type ShareTargetTab = "community" | "people";

function roleLabel(role: UserRole) {
  switch (role) {
    case UserRole.ADMIN:
      return "Admin";
    case UserRole.SELLER:
      return "Seller";
    default:
      return "Buyer";
  }
}

export function ShareArtworkModal() {
  const router = useRouter();
  const { artwork, isOpen, closeShareArtwork } = useShareArtworkStore();
  const [activeTab, setActiveTab] = useState<ShareTargetTab>("community");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !artwork) return;

    setActiveTab("community");
    setNote(`Check out ${artwork.title} on ArtVerse.`);
    setSearch("");
    setSelectedGroupId(null);
    setSelectedUserId(null);
  }, [artwork, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeShareArtwork();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [closeShareArtwork, isOpen]);

  const groupsQuery = useQuery({
    queryKey: ["share-artwork-groups"],
    queryFn: async () => {
      const response = await api.get("/groups?my=true");
      return response.data.data ?? [];
    },
    enabled: isOpen && activeTab === "community" && !!artwork,
  });

  const usersQuery = useQuery({
    queryKey: ["share-artwork-users", search],
    queryFn: async () => {
      const response = await api.get(`/users/search?search=${encodeURIComponent(search.trim())}`);
      return response.data.data ?? [];
    },
    enabled: isOpen && activeTab === "people" && !!artwork,
  });

  useEffect(() => {
    if (!selectedGroupId && groupsQuery.data?.length) {
      setSelectedGroupId(groupsQuery.data[0].id);
    }
  }, [groupsQuery.data, selectedGroupId]);

  const selectedGroup = useMemo(
    () => groupsQuery.data?.find((group: any) => group.id === selectedGroupId) ?? null,
    [groupsQuery.data, selectedGroupId]
  );

  const selectedUser = useMemo(
    () => usersQuery.data?.find((user: any) => user.id === selectedUserId) ?? null,
    [selectedUserId, usersQuery.data]
  );
  const artworkImage = normalizeImageSrc(artwork?.imageUrl);

  const shareMutation = useMutation({
    mutationFn: async () => {
      if (!artwork) {
        throw new Error("No artwork selected");
      }

      const content = note.trim() || `Check out ${artwork.title} on ArtVerse.`;
      const payload = {
        content,
        imageUrl: artworkImage,
        metadata: { artwork },
      };

      if (activeTab === "community") {
        if (!selectedGroupId) {
          throw new Error("Select a community to share into");
        }

        const response = await api.post(`/groups/${selectedGroupId}/messages`, payload);
        return { kind: "community" as const, data: response.data.data };
      }

      if (!selectedUserId) {
        throw new Error("Select a person to share with");
      }

      const response = await api.post(`/users/${selectedUserId}/messages`, payload);
      return { kind: "people" as const, data: response.data.data };
    },
    onSuccess: (result) => {
      if (result.kind === "people" && selectedUserId) {
        toast.success("Shared in personal chat");
        closeShareArtwork();
        router.push(`/messages/${selectedUserId}`);
        return;
      }

      toast.success("Shared to community");
      closeShareArtwork();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to share artwork");
    },
  });

  const canSend =
    !!artwork &&
    !!note.trim() &&
    !shareMutation.isPending &&
    ((activeTab === "community" && !!selectedGroupId) || (activeTab === "people" && !!selectedUserId));

  if (!isOpen || !artwork) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4"
        onClick={closeShareArtwork}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          onClick={(event) => event.stopPropagation()}
          className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-bg)] shadow-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">
                Share artwork
              </p>
              <h2 className="mt-1 font-display text-2xl text-[var(--color-text)]">Send this piece to a chat</h2>
            </div>
            <button
              onClick={closeShareArtwork}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              aria-label="Close share modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-0 overflow-y-auto lg:overflow-hidden lg:grid-cols-[1.1fr_0.9fr] flex-1 min-h-0">
            <div className="space-y-5 border-b border-[var(--color-border)] p-5 sm:p-6 lg:border-b-0 lg:border-r lg:overflow-y-auto scrollbar-thin">
              <div className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
                <div className="relative aspect-[4/3] w-full">
                  <SafeImage
                    src={artworkImage}
                    alt={artwork.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="line-clamp-1 text-lg font-semibold text-[var(--color-text)]">{artwork.title}</h3>
                      <p className="text-sm text-[var(--color-muted)]">{artwork.sellerName || "ArtVerse"}</p>
                    </div>
                    {artwork.price !== undefined && (
                      <span className="rounded-pill bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                        {formatPrice(artwork.price)}
                      </span>
                    )}
                  </div>
                  <Link
                    href={artwork.shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] transition hover:opacity-80"
                  >
                    <Copy size={14} />
                    Open share link
                  </Link>
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                <label className="mb-2 block text-sm font-semibold text-[var(--color-text)]">Add a note</label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
                  placeholder="Say something about this artwork..."
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-col p-5 sm:p-6">
              <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-2)] p-1 text-sm font-medium">
                <button
                  onClick={() => setActiveTab("community")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 transition ${
                    activeTab === "community"
                      ? "bg-[var(--color-accent)] text-white shadow-glow"
                      : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <Users size={15} />
                  Community
                </button>
                <button
                  onClick={() => setActiveTab("people")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 transition ${
                    activeTab === "people"
                      ? "bg-[var(--color-accent)] text-white shadow-glow"
                      : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <User size={15} />
                  Person
                </button>
              </div>

              <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-thin max-h-[240px] lg:max-h-none">
                {activeTab === "community" ? (
                  <div className="space-y-3">
                    {groupsQuery.isLoading ? (
                      <div className="space-y-3">
                        {[0, 1, 2].map((index) => (
                          <div key={index} className="h-20 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]" />
                        ))}
                      </div>
                    ) : groupsQuery.data?.length ? (
                      groupsQuery.data.map((group: any) => {
                        const isSelected = selectedGroupId === group.id;

                        return (
                          <button
                            key={group.id}
                            onClick={() => setSelectedGroupId(group.id)}
                            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                              isSelected
                                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/8"
                                : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)]/40"
                            }`}
                          >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                              <Users size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-[var(--color-text)]">{group.name}</p>
                                <span className="rounded-pill border border-[var(--color-border)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                                  {group.type === GroupType.PRIVATE ? "Private" : "Public"}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs text-[var(--color-muted)]">
                                {group.description || "No description provided"}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center text-sm text-[var(--color-muted)]">
                        Join a community first, then you can share artwork directly into the chat.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
                      <Search size={16} className="shrink-0 text-[var(--color-muted)]" />
                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search for a user"
                        className="w-full border-none bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                      />
                    </label>

                    {usersQuery.isLoading ? (
                      <div className="space-y-3">
                        {[0, 1, 2, 3].map((index) => (
                          <div key={index} className="h-18 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]" />
                        ))}
                      </div>
                    ) : usersQuery.data?.length ? (
                      usersQuery.data.map((user: any) => {
                        const isSelected = selectedUserId === user.id;

                        return (
                          <button
                            key={user.id}
                            onClick={() => setSelectedUserId(user.id)}
                            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                              isSelected
                                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/8"
                                : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent)]/40"
                            }`}
                          >
                            <UserAvatar name={user.name} avatar={user.avatar} className="h-11 w-11" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-[var(--color-text)]">{user.name}</p>
                                <span className="rounded-pill border border-[var(--color-border)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                                  {roleLabel(user.role)}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs text-[var(--color-muted)]">
                                {user.bio || user.email}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center text-sm text-[var(--color-muted)]">
                        No users found. Try a different name or email.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
                <div className="text-xs text-[var(--color-muted)]">
                  {activeTab === "community"
                    ? selectedGroup
                      ? `Sharing into ${selectedGroup.name}`
                      : "Select a community to continue"
                    : selectedUser
                      ? `Sending to ${selectedUser.name}`
                      : "Select a person to continue"}
                </div>
                <button
                  onClick={() => shareMutation.mutate()}
                  disabled={!canSend}
                  className="inline-flex items-center gap-2 rounded-input bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:shadow-glow-md disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={16} />
                  Share
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}