export function normalizeImageSrc(src?: string | null, fallbackSrc = "/placeholder.jpg") {
  if (typeof src !== "string") {
    return fallbackSrc;
  }

  const normalized = src.trim();
  if (!normalized) {
    return fallbackSrc;
  }

  const lower = normalized.toLowerCase();
  if (lower === "null" || lower === "undefined") {
    return fallbackSrc;
  }

  return normalized;
}