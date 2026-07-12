// ═══════════════════════════════════════════════════
// ArtVerse — Filter Sidebar Component
// ═══════════════════════════════════════════════════

"use client";

import { motion } from "framer-motion";
import { SlidersHorizontal, X, Star } from "lucide-react";
import { useCallback, useRef, useState } from "react";

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

const PRICE_MIN_LIMIT = 0;
const PRICE_MAX_LIMIT = 50000;
const PRICE_STEP = 100;
const PRICE_GAP = 500; // min gap between min and max

const PRICE_PRESETS = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500–₹2k", min: 500, max: 2000 },
  { label: "₹2k–₹10k", min: 2000, max: 10000 },
  { label: "₹10k+", min: 10000, max: 50000 },
];

function snap(value: number) {
  return Math.round(value / PRICE_STEP) * PRICE_STEP;
}

function formatPriceLabel(value: number) {
  if (value >= 1000) return `₹${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  return `₹${value}`;
}

function toPercent(value: number) {
  return ((value - PRICE_MIN_LIMIT) / (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT)) * 100;
}

function fromPercent(percent: number) {
  return snap(
    PRICE_MIN_LIMIT + (percent / 100) * (PRICE_MAX_LIMIT - PRICE_MIN_LIMIT),
  );
}

interface PriceRangeSliderProps {
  minPrice: number | undefined;
  maxPrice: number | undefined;
  onChange: (min: number | undefined, max: number | undefined) => void;
}

function PriceRangeSlider({ minPrice, maxPrice, onChange }: PriceRangeSliderProps) {
  // Local state drives the visual position immediately (smooth drag).
  // The parent onChange (which triggers the API) is only called after
  // the user stops dragging for DEBOUNCE_MS — prevents rate-limit errors.
  const DEBOUNCE_MS = 500;

  const [localMin, setLocalMin] = useState(minPrice ?? PRICE_MIN_LIMIT);
  const [localMax, setLocalMax] = useState(maxPrice ?? PRICE_MAX_LIMIT);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state if parent resets (e.g. "Reset all")
  const prevMinRef = useRef(minPrice);
  const prevMaxRef = useRef(maxPrice);
  if (prevMinRef.current !== minPrice || prevMaxRef.current !== maxPrice) {
    prevMinRef.current = minPrice;
    prevMaxRef.current = maxPrice;
    setLocalMin(minPrice ?? PRICE_MIN_LIMIT);
    setLocalMax(maxPrice ?? PRICE_MAX_LIMIT);
  }

  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"min" | "max" | null>(null);

  const minPercent = toPercent(localMin);
  const maxPercent = toPercent(localMax);

  // Debounce helper — schedules the API call
  const scheduleOnChange = useCallback(
    (nextMin: number, nextMax: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(
          nextMin === PRICE_MIN_LIMIT ? undefined : nextMin,
          nextMax === PRICE_MAX_LIMIT ? undefined : nextMax,
        );
      }, DEBOUNCE_MS);
    },
    [onChange],
  );

  const getValueFromPointer = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const percent = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    return fromPercent(percent);
  }, []);

  const startDrag = useCallback(
    (thumb: "min" | "max") => (e: React.PointerEvent) => {
      e.preventDefault();
      draggingRef.current = thumb;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      const value = getValueFromPointer(e.clientX);

      if (draggingRef.current === "min") {
        const next = Math.max(PRICE_MIN_LIMIT, Math.min(value, localMax - PRICE_GAP));
        setLocalMin(next);
        scheduleOnChange(next, localMax);
      } else {
        const next = Math.min(PRICE_MAX_LIMIT, Math.max(value, localMin + PRICE_GAP));
        setLocalMax(next);
        scheduleOnChange(localMin, next);
      }
    },
    [getValueFromPointer, localMax, localMin, scheduleOnChange],
  );

  const stopDrag = useCallback(() => {
    draggingRef.current = null;
    // Flush immediately on release — no need to wait for debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    onChange(
      localMin === PRICE_MIN_LIMIT ? undefined : localMin,
      localMax === PRICE_MAX_LIMIT ? undefined : localMax,
    );
  }, [localMin, localMax, onChange]);

  const activePreset = PRICE_PRESETS.find(
    (p) => p.min === (minPrice ?? 0) && p.max === (maxPrice ?? PRICE_MAX_LIMIT),
  );

  return (
    <div className="space-y-4">
      {/* Price labels — show local values for instant feedback */}
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-[var(--color-accent)]/10 px-2.5 py-1 text-xs font-bold text-[var(--color-accent)]">
          {formatPriceLabel(localMin)}
        </span>
        <span className="text-[11px] text-[var(--color-muted)]">to</span>
        <span className="rounded-lg bg-[var(--color-accent)]/10 px-2.5 py-1 text-xs font-bold text-[var(--color-accent)]">
          {localMax >= PRICE_MAX_LIMIT ? "₹50k+" : formatPriceLabel(localMax)}
        </span>
      </div>

      {/* Slider track */}
      <div
        ref={trackRef}
        className="relative mx-2 h-6 select-none"
        onPointerMove={onPointerMove}
        onPointerUp={stopDrag}
        onPointerLeave={(e) => {
          // only stop if no button held
          if (e.buttons === 0) stopDrag();
        }}
      >
        {/* Base track */}
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-[var(--color-border)]" />

        {/* Filled range */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[var(--color-accent)]"
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
        />

        {/* Min thumb */}
        <div
          role="slider"
          aria-label="Minimum price"
          aria-valuemin={PRICE_MIN_LIMIT}
          aria-valuemax={PRICE_MAX_LIMIT}
          aria-valuenow={localMin}
          tabIndex={0}
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-card)] shadow-md transition-shadow active:cursor-grabbing active:shadow-glow"
          style={{ left: `${minPercent}%`, zIndex: 20 }}
          onPointerDown={startDrag("min")}
          onKeyDown={(e) => {
            let next = localMin;
            if (e.key === "ArrowLeft") next = Math.max(PRICE_MIN_LIMIT, localMin - PRICE_STEP);
            else if (e.key === "ArrowRight") next = Math.min(localMin + PRICE_STEP, localMax - PRICE_GAP);
            else return;
            setLocalMin(next);
            onChange(next === PRICE_MIN_LIMIT ? undefined : next, minPrice);
          }}
        />

        {/* Max thumb */}
        <div
          role="slider"
          aria-label="Maximum price"
          aria-valuemin={PRICE_MIN_LIMIT}
          aria-valuemax={PRICE_MAX_LIMIT}
          aria-valuenow={localMax}
          tabIndex={0}
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-card)] shadow-md transition-shadow active:cursor-grabbing active:shadow-glow"
          style={{ left: `${maxPercent}%`, zIndex: 20 }}
          onPointerDown={startDrag("max")}
          onKeyDown={(e) => {
            let next = localMax;
            if (e.key === "ArrowLeft") next = Math.max(localMax - PRICE_STEP, localMin + PRICE_GAP);
            else if (e.key === "ArrowRight") next = Math.min(PRICE_MAX_LIMIT, localMax + PRICE_STEP);
            else return;
            setLocalMax(next);
            onChange(maxPrice, next === PRICE_MAX_LIMIT ? undefined : next);
          }}
        />
      </div>

      {/* Preset chips */}
      <div className="flex flex-wrap gap-1.5">
        {PRICE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              const nextMin = preset.min === PRICE_MIN_LIMIT ? undefined : preset.min;
              const nextMax = preset.max === PRICE_MAX_LIMIT ? undefined : preset.max;
              setLocalMin(preset.min);
              setLocalMax(preset.max);
              if (debounceRef.current) clearTimeout(debounceRef.current);
              onChange(nextMin, nextMax);
            }}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${activePreset?.label === preset.label
                ? "bg-[var(--color-accent)] text-white shadow-sm"
                : "bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]"
              }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

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
              className={`w-full rounded-input px-3 py-2 text-left text-sm transition-colors ${filters.sortBy === option.value
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
            className={`w-full rounded-input px-3 py-2 text-left text-sm transition-colors ${!filters.category
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
              className={`w-full rounded-input px-3 py-2 text-left text-sm transition-colors ${filters.category === cat
                  ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-card)]"
                }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range — dual slider */}
      <div>
        <h4 className="mb-4 text-sm font-semibold text-[var(--color-muted)]">
          Price Range
        </h4>
        <PriceRangeSlider
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          onChange={(min, max) => onFilterChange({ minPrice: min, maxPrice: max })}
        />
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
