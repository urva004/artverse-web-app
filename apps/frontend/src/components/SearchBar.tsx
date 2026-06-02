// ═══════════════════════════════════════════════════
// ArtVerse — Search Bar Component
// ═══════════════════════════════════════════════════

"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";

import { debounce } from "@artverse/utils";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  defaultValue?: string;
  className?: string;
}

export function SearchBar({
  placeholder = "Search art, artists, materials...",
  onSearch,
  defaultValue = "",
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      if (onSearch) {
        onSearch(value);
      } else {
        router.push(`/marketplace?search=${encodeURIComponent(value)}`);
      }
    }, 400),
    [onSearch, router],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length >= 2 || value.length === 0) {
      debouncedSearch(value);
    }
  };

  const handleClear = () => {
    setQuery("");
    if (onSearch) {
      onSearch("");
    }
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    } else {
      router.push(`/marketplace?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-pill border border-[var(--color-border)] bg-[var(--color-card)] pl-11 pr-10 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] transition-all focus:border-[var(--color-accent)] focus:outline-none focus:shadow-glow"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          <X size={16} />
        </button>
      )}
    </form>
  );
}
