// ═══════════════════════════════════════════════════
// ArtVerse — Landing Page
// ═══════════════════════════════════════════════════

"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Palette,
  Users,
  ShoppingBag,
  MessageCircle,
  Star,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CATEGORY_LABELS } from "@artverse/utils";

const FEATURES = [
  {
    icon: ShoppingBag,
    title: "Art Marketplace",
    description:
      "Buy & sell original artworks, prints, and art supplies from talented artists.",
    color: "var(--color-accent)",
  },
  {
    icon: Palette,
    title: "Artist Portfolios",
    description:
      "Showcase your work with beautiful gallery profiles that attract collectors.",
    color: "var(--color-teal)",
  },
  {
    icon: Users,
    title: "Community Groups",
    description:
      "Join interest-based groups and connect with fellow art enthusiasts.",
    color: "var(--color-gold)",
  },
  {
    icon: MessageCircle,
    title: "Real-time Chat",
    description:
      "Chat with artists and collectors in group channels with live messaging.",
    color: "var(--color-rose)",
  },
];

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
  key,
  label,
}));

const STATS = [
  { value: "10K+", label: "Artists" },
  { value: "50K+", label: "Artworks" },
  { value: "100K+", label: "Collectors" },
  { value: "₹2Cr+", label: "Art Sold" },
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* ── Hero Section ── */}
      <section className="relative flex min-h-[90vh] items-center justify-center px-4 py-20">
        {/* Gradient orbs background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[var(--color-accent)] opacity-10 blur-[120px]" />
          <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[var(--color-teal)] opacity-10 blur-[100px]" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-gold)] opacity-5 blur-[80px]" />
        </div>

        <div className="mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-pill border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-1.5 text-sm text-[var(--color-accent)]">
              <Sparkles size={14} />
              The Art Community Platform
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 font-display text-display-lg leading-tight md:text-display-xl"
          >
            Discover, Create & <span className="gradient-text">Sell Art</span>
            <br />
            Like Never Before
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-10 max-w-2xl text-body-lg text-[var(--color-muted)]"
          >
            ArtVerse is where artists showcase their talent, collectors find
            unique pieces, and everyone connects through the love of art. From
            paintings to digital art, mehndi to sketches.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href="/marketplace"
              className="group flex items-center gap-2 rounded-pill bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] px-8 py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:shadow-glow-md"
            >
              Explore Marketplace
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/auth/register"
              className="flex items-center gap-2 rounded-pill border border-[var(--color-border)] px-8 py-3.5 text-sm font-semibold text-[var(--color-text)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Start Selling
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 flex justify-center gap-8 md:gap-16"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-2xl font-bold text-[var(--color-text)] md:text-3xl">
                  {stat.value}
                </p>
                <p className="text-xs text-[var(--color-muted)] md:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Categories Section ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 font-display text-display-sm">
              Browse by <span className="gradient-text">Category</span>
            </h2>
            <p className="text-[var(--color-muted)]">
              Find exactly what you&apos;re looking for
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/marketplace?category=${cat.key}`}
                  className="group flex flex-col items-center gap-3 rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6 transition-all hover:-translate-y-1 hover:border-[var(--color-accent)]/30 hover:shadow-glow"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] transition-colors group-hover:bg-[var(--color-accent)]/20">
                    <Palette size={24} />
                  </div>
                  <span className="text-center text-sm font-medium">
                    {cat.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 font-display text-display-sm">
              Everything You Need,{" "}
              <span className="gradient-text">One Platform</span>
            </h2>
            <p className="text-[var(--color-muted)]">
              Built for artists, collectors, and art enthusiasts
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-card border border-[var(--color-border)] bg-[var(--color-card)] p-6 transition-all hover:-translate-y-1 hover:shadow-glow"
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-card"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${feature.color} 15%, transparent)`,
                    color: feature.color,
                  }}
                >
                  <feature.icon size={24} />
                </div>
                <h3 className="mb-2 font-display text-lg font-bold">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-muted)]">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-card border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-card)] to-[var(--color-bg-2)] p-10 text-center md:p-16"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--color-accent)] opacity-10 blur-[60px]" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[var(--color-teal)] opacity-10 blur-[50px]" />

            <h2 className="mb-4 font-display text-display-sm">
              Ready to Join the{" "}
              <span className="gradient-text">Art Revolution?</span>
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-[var(--color-muted)]">
              Whether you&apos;re an artist looking to reach new audiences or a
              collector searching for your next masterpiece, ArtVerse is your
              home.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth/register"
                className="rounded-pill bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-teal)] px-8 py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:shadow-glow-md"
              >
                Create Free Account
              </Link>
              <Link
                href="/marketplace"
                className="rounded-pill border border-[var(--color-border)] px-8 py-3.5 text-sm font-semibold transition hover:border-[var(--color-accent)]"
              >
                Browse Art
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--color-border)] px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-card bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-teal)]">
              <span className="font-display text-sm font-bold text-white">
                A
              </span>
            </div>
            <span className="font-display font-bold">ArtVerse</span>
          </div>
          <p className="text-sm text-[var(--color-muted)]">
            &copy; {new Date().getFullYear()} ArtVerse. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-[var(--color-muted)]">
            <Link href="#" className="hover:text-[var(--color-text)]">
              Privacy
            </Link>
            <Link href="#" className="hover:text-[var(--color-text)]">
              Terms
            </Link>
            <Link href="#" className="hover:text-[var(--color-text)]">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
