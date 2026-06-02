// ═══════════════════════════════════════════════════
// ArtVerse — Skeleton Loader Components
// ═══════════════════════════════════════════════════

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="skeleton-shimmer aspect-[4/3]" />
      <div className="space-y-3 p-4">
        <div className="skeleton-shimmer h-3 w-16 rounded" />
        <div className="skeleton-shimmer h-4 w-3/4 rounded" />
        <div className="flex items-center justify-between">
          <div className="skeleton-shimmer h-3 w-12 rounded" />
          <div className="skeleton-shimmer h-4 w-16 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TextSkeleton({
  width = "w-full",
  height = "h-4",
}: {
  width?: string;
  height?: string;
}) {
  return <div className={`skeleton-shimmer ${width} ${height} rounded`} />;
}

export function AvatarSkeleton({ size = "h-10 w-10" }: { size?: string }) {
  return <div className={`skeleton-shimmer ${size} rounded-full`} />;
}
