"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Star,
  Package,
  Search,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import Link from "next/link";
import { formatPrice, formatDate, ArtCategory, CATEGORY_LABELS } from "@artverse/utils";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { SafeImage } from "@/components/SafeImage";
import { normalizeImageSrc } from "@/lib/image";

// Modals
import { EditProductModal } from "@/components/dashboard/EditProductModal";
import { DeleteConfirmationModal } from "@/components/dashboard/DeleteConfirmationModal";

export default function ManagingProductsPage() {
  const { user, isAuthenticated } = useAuthStore();

  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch only the logged in user's distinct artworks!
  const { data: products, isLoading } = useQuery({
    queryKey: ["seller-products"],
    queryFn: async () => {
      const r = await api.get("/artworks/user");
      return r.data.data;
    },
    enabled: isAuthenticated && (user?.role === "SELLER" || user?.role === "ADMIN"),
  });

  if (!isAuthenticated || (user?.role !== "SELLER" && user?.role !== "ADMIN")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <h2 className="font-display text-xl">Access Denied</h2>
        <p className="text-sm text-[var(--color-muted)]">
          Only sellers can manage artworks
        </p>
      </div>
    );
  }

  // Filter artworks
  const filtered = (products || []).filter((p: any) => {
    const matchSearch =
      !searchTerm ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === "ALL" || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const totalProducts = products?.length || 0;
  const liveProducts = products?.filter((p: any) => p.isApproved)?.length || 0;
  const pendingProducts = totalProducts - liveProducts;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div>
          <h1 className="font-display text-display-sm">
            Manage <span className="gradient-text">Artwork</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Edit your listings, update prices, or remove artworks from the global marketplace.
          </p>
        </div>
        <Link
          href="/dashboard/upload"
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-teal)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition hover:brightness-110"
        >
          <Plus size={16} />
          Upload New
        </Link>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 grid grid-cols-3 gap-4"
      >
        {[
          { label: "Total Artworks", value: totalProducts, icon: Package, color: "var(--color-accent)" },
          { label: "Live", value: liveProducts, icon: Eye, color: "var(--color-teal)" },
          { label: "Pending", value: pendingProducts, icon: Star, color: "var(--color-gold)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${stat.color}15` }}
            >
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">{stat.label}</p>
              <p className="font-display text-xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            type="text"
            placeholder="Search your artworks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] pl-10 pr-4 text-sm focus:border-[var(--color-accent)] focus:outline-none transition"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-11 appearance-none rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] pl-9 pr-8 text-sm focus:border-[var(--color-accent)] focus:outline-none transition"
            >
              <option value="ALL">All Categories</option>
              {Object.values(ArtCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] || cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex rounded-xl border border-[var(--color-border)] overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex h-11 w-11 items-center justify-center transition ${viewMode === "grid" ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "bg-[var(--color-card)] text-[var(--color-muted)] hover:text-[var(--color-text)]"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex h-11 w-11 items-center justify-center transition ${viewMode === "list" ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]" : "bg-[var(--color-card)] text-[var(--color-muted)] hover:text-[var(--color-text)]"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Artworks */}
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent shadow-glow" />
        </div>
      ) : filtered.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product: any, index: number) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm transition hover:shadow-lg hover:border-[var(--color-accent)]/30"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-[var(--color-bg)]">
                  <SafeImage
                    src={normalizeImageSrc(product.images?.[0])}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute left-3 top-3 flex flex-col gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold shadow-sm backdrop-blur-md ${
                        product.isApproved
                          ? "bg-emerald-500/80 text-white"
                          : "bg-[var(--color-gold)]/80 text-white"
                      }`}
                    >
                      {product.isApproved ? "● Live" : "◐ Pending"}
                    </span>
                  </div>

                  {/* Quick Actions Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[var(--color-accent)] shadow-lg transition hover:scale-110"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeletingProduct(product)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[var(--color-rose)] shadow-lg transition hover:scale-110"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="line-clamp-1 font-display font-bold text-[var(--color-text)]">
                      {product.title}
                    </h3>
                  </div>
                  <p className="mb-2 text-xs text-[var(--color-muted)] opacity-80">
                    {CATEGORY_LABELS[product.category as ArtCategory] || product.category}
                  </p>
                  <p className="mb-3 line-clamp-2 text-xs text-[var(--color-muted)]">
                    {product.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                    <span className="font-mono text-sm font-bold text-[var(--color-accent)]">
                      {formatPrice(product.price)}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-[var(--color-muted)]">
                      <span className="flex items-center gap-1" title="Views">
                        <Eye size={12} />
                        {product.views || 0}
                      </span>
                      <span className="flex items-center gap-1" title="Stock">
                        <Package size={12} />
                        {product.stock}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filtered.map((product: any, index: number) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition hover:border-[var(--color-accent)]/30 hover:shadow-md"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--color-bg)]">
                  <SafeImage
                    src={normalizeImageSrc(product.images?.[0])}
                    alt={product.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-display font-bold text-sm">
                      {product.title}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        product.isApproved
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-[var(--color-gold)]/10 text-[var(--color-gold)]"
                      }`}
                    >
                      {product.isApproved ? "Live" : "Pending"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    {CATEGORY_LABELS[product.category as ArtCategory] || product.category} · {formatDate(product.createdAt)}
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-4 text-xs text-[var(--color-muted)]">
                  <span className="flex items-center gap-1"><Eye size={12} />{product.views || 0}</span>
                  <span className="flex items-center gap-1"><Package size={12} />{product.stock}</span>
                </div>

                <span className="font-mono text-sm font-bold text-[var(--color-accent)]">
                  {formatPrice(product.price)}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] transition hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingProduct(product)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-bg)] text-[var(--color-muted)] transition hover:bg-[var(--color-rose)]/10 hover:text-[var(--color-rose)]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)]">
            <Plus size={32} />
          </div>
          <h2 className="font-display text-lg font-bold">
            {searchTerm || filterCategory !== "ALL" ? "No Matching Artworks" : "No Artworks Found"}
          </h2>
          <p className="mb-6 mt-2 max-w-sm text-sm text-[var(--color-muted)]">
            {searchTerm || filterCategory !== "ALL"
              ? "Try adjusting your search or filter criteria."
              : "You haven't uploaded any artworks to your portfolio yet. Click the upload button to get started."}
          </p>
          {!searchTerm && filterCategory === "ALL" && (
            <Link
              href="/dashboard/upload"
              className="rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-teal)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg"
            >
              Upload Now
            </Link>
          )}
        </div>
      )}

      {/* Render Modals */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {deletingProduct && (
        <DeleteConfirmationModal
          productId={deletingProduct.id}
          productName={deletingProduct.title}
          onClose={() => setDeletingProduct(null)}
        />
      )}
    </div>
  );
}
