// ═══════════════════════════════════════════════════
// ArtVerse — Root Layout
// ═══════════════════════════════════════════════════

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Navbar } from "@/components/Navbar";
import { CartInitializer } from "@/components/cart/CartInitializer";
import { ShareArtworkModal } from "@/components/ShareArtworkModal";
import { SessionInitializer } from "@/components/SessionInitializer";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { SocketProvider } from "@/providers/SocketProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ArtVerse — Discover, Create & Sell Art",
    template: "%s | ArtVerse",
  },
  description:
    "ArtVerse is the premier marketplace for artists and art lovers. Discover unique artworks, connect with creators, and build your collection.",
  keywords: [
    "art marketplace",
    "buy art online",
    "sell art",
    "digital art",
    "paintings",
    "sketches",
    "mehndi designs",
    "art community",
  ],
  openGraph: {
    title: "ArtVerse — Discover, Create & Sell Art",
    description:
      "The premier marketplace for artists and art lovers. Discover unique artworks and connect with creators.",
    type: "website",
    locale: "en_IN",
    siteName: "ArtVerse",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--color-bg)] font-body text-[var(--color-text)] antialiased">
        <ThemeProvider>
          <QueryProvider>
            <SocketProvider>
              <SessionInitializer />
              <CartInitializer />
              <Navbar />
              <ShareArtworkModal />
              <main className="min-h-[calc(100vh-4rem)] pb-20 md:pb-0">
                {children}
              </main>
            </SocketProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
