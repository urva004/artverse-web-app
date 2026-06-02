// ═══════════════════════════════════════════════════
// ArtVerse — Shared Helpers
// ═══════════════════════════════════════════════════

/**
 * Format a number as Indian Rupee (INR) currency string
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string into a human-readable relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${diffYears}y ago`;
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

/**
 * Generate star rating display data
 */
export function getStarRating(rating: number): {
  full: number;
  half: boolean;
  empty: number;
} {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return { full, half, empty };
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Slugify a string for URL-friendly usage
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a random avatar URL from DiceBear API
 */
export function getDefaultAvatar(seed: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=c77dff&textColor=ffffff`;
}

/**
 * Build initials from a display name.
 */
export function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";

  return `${first}${last}`.toUpperCase() || "?";
}

/**
 * Art category labels for display
 */
export const CATEGORY_LABELS: Record<string, string> = {
  LIP_ART: "Lip Art",
  SKETCHES: "Sketches",
  MEHNDI_DESIGNS: "Mehndi Designs",
  PAINTINGS: "Paintings",
  DIGITAL_ART: "Digital Art",
  ART_MATERIALS: "Art Materials",
};

/**
 * Order status labels with color mapping
 */
export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  PENDING: { label: "Pending", color: "gold" },
  CONFIRMED: { label: "Confirmed", color: "teal" },
  PROCESSING: { label: "Processing", color: "accent" },
  SHIPPED: { label: "Shipped", color: "accent" },
  DELIVERED: { label: "Delivered", color: "success" },
  CANCELLED: { label: "Cancelled", color: "rose" },
  REFUNDED: { label: "Refunded", color: "muted" },
};

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Validate that a file is an allowed image type
 */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Only JPG, PNG, and WebP images are allowed";
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "Image must be under 5MB";
  }
  return null;
}

/**
 * Build query string from filter object (removes undefined/null values)
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const filtered = Object.entries(params)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    );
  return filtered.length > 0 ? `?${filtered.join("&")}` : "";
}
