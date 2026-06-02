// ═══════════════════════════════════════════════════
// ArtVerse — Navbar Component
// ═══════════════════════════════════════════════════

"use client";

import { motion } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  Store,
  Users,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";

import { UserAvatar } from "@/components/UserAvatar";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { NotificationDropdown } from "@/components/NotificationDropdown";

const NAV_LINKS = [
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/artists", label: "Artists", icon: Users },
  { href: "/community", label: "Community", icon: MessageCircle },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuthStore();
  const cartItems = useCartStore((s) => s.items);
  const totalItems = cartItems.length;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // -- Desktop Auth Content --
  let desktopAuthNodes;
  if (!mounted) {
    desktopAuthNodes = (
      <div className="hidden items-center gap-2 md:flex w-[140px]"></div>
    );
  } else if (isAuthenticated) {
    desktopAuthNodes = (
      <div ref={profileMenuRef} className="hidden items-center gap-2 md:flex">
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full ring-0 transition hover:shadow-glow"
            aria-label="Open profile menu"
            aria-expanded={profileMenuOpen}
          >
            <UserAvatar
              name={user?.name || "User"}
              avatar={user?.avatar}
              className="h-9 w-9 text-[11px]"
              textClassName="text-[11px] font-bold"
            />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 top-12 z-[80] w-72 overflow-hidden rounded-card border border-[var(--color-border)] bg-[var(--color-card)] shadow-2xl">
              <div className="border-b border-[var(--color-border)] p-4">
                <p className="font-semibold text-[var(--color-text)]">
                  {user?.name || "Profile"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                    {user?.role || "BUYER"}
                  </span>
                  {(user?.role === "SELLER" || user?.role === "ADMIN") && (
                    <Link
                      href="/dashboard"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-1 rounded-full bg-[var(--color-accent)]/10 px-2.5 py-1 text-[10px] font-semibold text-[var(--color-accent)]"
                    >
                      <LayoutDashboard size={12} />
                      Dashboard
                    </Link>
                  )}
                </div>
              </div>

              <div className="p-2">
                <Link
                  href={`/artists/${user?.id}`}
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center justify-between rounded-input px-3 py-2.5 text-sm text-[var(--color-muted)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                >
                  <span>View profile</span>
                  <User size={15} />
                </Link>
                <button
                  type="button"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="mt-1 flex w-full items-center justify-between rounded-input px-3 py-2.5 text-sm text-[var(--color-muted)] transition hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]"
                >
                  <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                  {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setProfileMenuOpen(false);
                    await logout();
                  }}
                  className="mt-1 flex w-full items-center justify-between rounded-input px-3 py-2.5 text-sm text-[var(--color-rose)] transition hover:bg-[var(--color-rose)]/10"
                >
                  <span>Logout</span>
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else {
    desktopAuthNodes = (
      <div className="hidden items-center gap-2 md:flex">
        <Link
          href="/auth/login"
          className="rounded-input px-4 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
        >
          Log in
        </Link>
        <Link
          href="/auth/register"
          className="rounded-pill bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-5 py-2 text-sm font-semibold text-white shadow-glow transition-all hover:shadow-glow-md"
        >
          Sign up
        </Link>
      </div>
    );
  }

  // -- Mobile Auth Content --
  let mobileAuthNodes;
  if (!mounted) {
    mobileAuthNodes = null;
  } else if (isAuthenticated) {
    mobileAuthNodes = (
      <>
        <Link
          href={`/artists/${user?.id}`}
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-3 rounded-input px-4 py-3 text-sm text-[var(--color-muted)] hover:bg-[var(--color-card)]"
        >
          <User size={18} />
          Profile
        </Link>
        <button
          onClick={() => {
            logout();
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 rounded-input px-4 py-3 text-sm text-[var(--color-rose)] hover:bg-[var(--color-card)]"
        >
          <LogOut size={18} />
          Logout
        </button>
      </>
    );
  } else {
    mobileAuthNodes = (
      <div className="flex gap-2 pt-2">
        <Link
          href="/auth/login"
          onClick={() => setMobileMenuOpen(false)}
          className="flex-1 rounded-input border border-[var(--color-border)] px-4 py-2.5 text-center text-sm font-medium"
        >
          Log in
        </Link>
        <Link
          href="/auth/register"
          onClick={() => setMobileMenuOpen(false)}
          className="flex-1 rounded-pill bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-4 py-2.5 text-center text-sm font-semibold text-white"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-card bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-teal)]">
              <span className="font-display text-lg font-bold text-white">
                A
              </span>
            </div>
            <span className="font-display text-xl font-bold">
              Art<span className="gradient-text">Verse</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative rounded-pill px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[var(--color-accent)]"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.5,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-input text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
              aria-label="Toggle theme"
            >
              {!mounted ? (
                <div className="h-[18px] w-[18px]"></div>
              ) : theme === "dark" ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>

            {mounted && isAuthenticated && (
              <>
                <NotificationDropdown />
                <Link
                  href="/wishlist"
                  className="flex h-9 w-9 items-center justify-center rounded-input text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
                >
                  <Heart size={18} />
                </Link>
              </>
            )}

            <Link
              href="/cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-input text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
            >
              <ShoppingCart size={18} />
              {mounted && totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[10px] font-bold text-white">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>

            {desktopAuthNodes}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-input text-[var(--color-muted)] transition-colors hover:bg-[var(--color-card)] md:hidden"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border-t border-[var(--color-border)] bg-[var(--color-bg)] p-4 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-input px-4 py-3 text-sm font-medium transition-colors ${
                    pathname.startsWith(link.href)
                      ? "bg-[var(--color-card)] text-[var(--color-accent)]"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-card)]"
                  }`}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              ))}
              <hr className="border-[var(--color-border)]" />
              {mobileAuthNodes}
            </div>
          </motion.div>
        )}
      </nav>

      <div className="h-16" />

      <div className="bottom-nav flex items-center justify-around py-2 md:hidden">
        {[
          { href: "/", icon: Store, label: "Home" },
          { href: "/marketplace", icon: Search, label: "Browse" },
          {
            href: "/cart",
            icon: ShoppingCart,
            label: "Cart",
            badge: totalItems,
          },
          { href: "/community", icon: MessageCircle, label: "Chat" },
          {
            href: isAuthenticated ? `/artists/${user?.id}` : "/auth/login",
            icon: User,
            label: "Profile",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] ${
              pathname === item.href
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-muted)]"
            }`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
            {mounted && item.badge && item.badge > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-accent)] text-[8px] font-bold text-white">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </>
  );
}
