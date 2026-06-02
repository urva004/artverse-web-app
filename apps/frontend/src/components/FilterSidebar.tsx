// ═══════════════════════════════════════════════════
// ArtVerse — Filter Sidebar Component
// ═══════════════════════════════════════════════════

"use client";

import { motion } from "framer-motion";
import { SlidersHorizontal, X, Star } from "lucide-react";
import { useState } from "react";

import { ArtCategory, CATEGORY_LABELS } from "@artverse/utils";

interface FilterSidebarProps {
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sortBy?: string;
  };
  onFilterChange: (
    filters: Record<string, string | number | undefined>,
  ) => void;
  onReset: () => void;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "popular", label: "Most Popular" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "rating", label: "Highest Rated" },
];

export function FilterSidebar({
  filters,
  onFilterChange,
  onReset,
}: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">Filters</h3>
        <button
          onClick={onReset}
          className="text-xs font-medium text-[var(--color-accent)] hover:underline"
        >
          Reset all
        </button>
      </div>

      {/* Sort */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
          Sort By
        </h4>
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange({ sortBy: option.value })}
              className={`w-full rounded-input px-3 py-2 text-left text-sm transition-colors ${
                filters.sortBy === option.value
                  ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-card)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
          Category
        </h4>
        <div className="space-y-1.5">
          <button
            onClick={() => onFilterChange({ category: undefined })}
            className={`w-full rounded-input px-3 py-2 text-left text-sm transition-colors ${
              !filters.category
                ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-card)]"
            }`}
          >
            All Categories
          </button>
          {Object.values(ArtCategory).map((cat) => (
            <button
              key={cat}
              onClick={() => onFilterChange({ category: cat })}
              className={`w-full rounded-input px-3 py-2 text-left text-sm transition-colors ${
                filters.category === cat
                  ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-card)]"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
          Price Range
        </h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              onFilterChange({
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              onFilterChange({
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-input border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
          Minimum Rating
        </h4>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() =>
                onFilterChange({
                  minRating: filters.minRating === star ? undefined : star,
                })
              }
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                size={20}
                className={
                  star <= (filters.minRating ?? 0)
                    ? "fill-[var(--color-gold)] text-[var(--color-gold)]"
                    : "text-[var(--color-muted)]"
                }
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20 rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          {sidebar}
        </div>
      </aside>

      {/* Mobile Filter Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-20 right-4 z-modal flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-glow lg:hidden"
      >
        <SlidersHorizontal size={20} />
      </button>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-modal-backdrop bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed bottom-0 right-0 top-0 z-modal w-80 overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-bg)] p-5 lg:hidden"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="mb-4 flex h-9 w-9 items-center justify-center rounded-input text-[var(--color-muted)] hover:bg-[var(--color-card)]"
            >
              <X size={20} />
            </button>
            {sidebar}
          </motion.div>
        </>
      )}
    </>
  );
}
