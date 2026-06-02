// ═══════════════════════════════════════════════════
// ArtVerse — Marketplace Page
// ═══════════════════════════════════════════════════

"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { PackageOpen } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useCallback, Suspense } from "react";
import toast from "react-hot-toast";

import { FilterSidebar } from "@/components/FilterSidebar";
import { ProductCard } from "@/components/ProductCard";
import { SearchBar } from "@/components/SearchBar";
import { ProductGridSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";

interface ProductResponse {
  success: boolean;
  data: Array<{
    id: string;
    title: string;
    price: number;
    images: string[];
    category: string;
    averageRating: number;
    reviewCount: number;
    stock: number;
    seller: { id: string; name: string; avatar: string | null };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState({
    category: searchParams.get("category") || undefined,
    minPrice: searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined,
    minRating: searchParams.get("minRating")
      ? Number(searchParams.get("minRating"))
      : undefined,
    sortBy: searchParams.get("sortBy") || "newest",
    search: searchParams.get("search") || undefined,
    page: 1,
  });

  const { data, isLoading, isError } = useQuery<ProductResponse>({
    queryKey: ["artworks", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.set(key, String(value));
        }
      });
      const response = await api.get(`/artworks?${params.toString()}`);
      return response.data;
    },
  });

  const handleFilterChange = useCallback(
    (newFilters: Record<string, string | number | undefined>) => {
      setFilters((prev) => {
        const nextFilters = { ...prev, ...newFilters, page: 1 };

        if (
          nextFilters.minPrice !== undefined &&
          nextFilters.maxPrice !== undefined &&
          Number(nextFilters.minPrice) > Number(nextFilters.maxPrice)
        ) {
          toast.error("Minimum price must be less than or equal to maximum price");
          return prev;
        }

        return nextFilters;
      });
    },
    [],
  );

  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, search: query || undefined, page: 1 }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters({
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      sortBy: "newest",
      search: undefined,
      page: 1,
    });
  }, []);

  const products = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="mb-2 font-display text-display-sm">
          <span className="gradient-text">Marketplace</span>
        </h1>
        <p className="text-[var(--color-muted)]">
          Discover unique artworks from talented artists
        </p>
      </motion.div>

      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar
          onSearch={handleSearch}
          defaultValue={filters.search}
          className="max-w-xl"
        />
      </div>

      {/* Main Layout */}
      <div className="flex gap-8">
        {/* Filter Sidebar */}
        <FilterSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
        />

        {/* Artwork Grid */}
        <div className="min-w-0 flex-1">
          {/* Results count */}
          {pagination && (
            <p className="mb-6 text-sm text-[var(--color-muted)]">
              Showing{" "}
              <span className="font-semibold text-[var(--color-text)]">
                {products.length}
              </span>{" "}
              of {pagination.total} results
            </p>
          )}

          {/* Loading */}
          {isLoading && <ProductGridSkeleton count={8} />}

          {/* Error */}
          {isError && (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <p className="text-[var(--color-rose)]">
                Failed to load artworks. Please try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-input bg-[var(--color-card)] px-6 py-2 text-sm font-medium hover:bg-[var(--color-accent)]/10"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && products.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-20 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-card)]">
                <PackageOpen size={28} className="text-[var(--color-muted)]" />
              </div>
              <h3 className="font-display text-lg font-bold">
                No artworks found
              </h3>
              <p className="max-w-sm text-sm text-[var(--color-muted)]">
                Try adjusting your filters or search for something else.
              </p>
              <button
                onClick={handleReset}
                className="mt-2 rounded-pill bg-[var(--color-accent)] px-6 py-2 text-sm font-semibold text-white"
              >
                Clear Filters
              </button>
            </motion.div>
          )}

          {/* Artwork Grid */}
          {!isLoading && !isError && products.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => (
                <ProductCard key={product.id} {...product} index={index} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={!pagination.hasPrev}
                className="rounded-input border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-30"
              >
                Previous
              </button>
              <span className="px-4 text-sm text-[var(--color-muted)]">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: prev.page + 1,
                  }))
                }
                disabled={!pagination.hasNext}
                className="rounded-input border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8">
          <ProductGridSkeleton count={8} />
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
