// ═══════════════════════════════════════════════════
// ArtVerse — Share Artwork Store
// ═══════════════════════════════════════════════════

import { create } from "zustand";

import type { SharedArtwork } from "@artverse/utils";

interface ShareArtworkState {
  artwork: SharedArtwork | null;
  isOpen: boolean;
  openShareArtwork: (artwork: SharedArtwork) => void;
  closeShareArtwork: () => void;
}

export const useShareArtworkStore = create<ShareArtworkState>()((set) => ({
  artwork: null,
  isOpen: false,
  openShareArtwork: (artwork) => set({ artwork, isOpen: true }),
  closeShareArtwork: () => set({ artwork: null, isOpen: false }),
}));