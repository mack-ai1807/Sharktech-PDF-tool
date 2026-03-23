/**
 * useSearchStore.ts
 * Zustand slice for full-text search state.
 * Works alongside the SearchService singleton and pdf-search utilities.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { SearchHit } from "@/lib/pdf-search";
import { useViewerStore } from "@/stores/viewerStore";

// ── State ─────────────────────────────────────────────────────────────────────

interface SearchState {
  query: string;
  caseSensitive: boolean;
  hits: SearchHit[];
  /** -1 when no active hit */
  activeHitIndex: number;
  isIndexing: boolean;
  /** 0–100 */
  indexProgress: number;
}

// ── Actions ───────────────────────────────────────────────────────────────────

interface SearchActions {
  setQuery: (q: string) => void;
  setCaseSensitive: (v: boolean) => void;
  setHits: (hits: SearchHit[]) => void;
  setIsIndexing: (v: boolean) => void;
  setIndexProgress: (v: number) => void;
  nextHit: () => void;
  prevHit: () => void;
  clearSearch: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSearchStore = create<SearchState & SearchActions>()(
  devtools(
    (set, get) => ({
      // ── Initial state ─────────────────────────────────────────────────────
      query: "",
      caseSensitive: false,
      hits: [],
      activeHitIndex: -1,
      isIndexing: false,
      indexProgress: 0,

      // ── Actions ───────────────────────────────────────────────────────────
      setQuery: (q) =>
        set({ query: q, hits: [], activeHitIndex: -1 }, false, "setQuery"),

      setCaseSensitive: (v) =>
        set({ caseSensitive: v, hits: [], activeHitIndex: -1 }, false, "setCaseSensitive"),

      setHits: (hits) =>
        set(
          { hits, activeHitIndex: hits.length > 0 ? 0 : -1 },
          false,
          "setHits"
        ),

      setIsIndexing: (v) =>
        set({ isIndexing: v }, false, "setIsIndexing"),

      setIndexProgress: (v) =>
        set({ indexProgress: v }, false, "setIndexProgress"),

      nextHit: () => {
        const { hits, activeHitIndex } = get();
        if (hits.length === 0) return;
        const next = (activeHitIndex + 1) % hits.length;
        set({ activeHitIndex: next }, false, "nextHit");
        const hit = hits[next];
        if (hit) useViewerStore.getState().goToPage(hit.pageIndex + 1);
      },

      prevHit: () => {
        const { hits, activeHitIndex } = get();
        if (hits.length === 0) return;
        const prev = (activeHitIndex - 1 + hits.length) % hits.length;
        set({ activeHitIndex: prev }, false, "prevHit");
        const hit = hits[prev];
        if (hit) useViewerStore.getState().goToPage(hit.pageIndex + 1);
      },

      clearSearch: () =>
        set(
          {
            query: "",
            hits: [],
            activeHitIndex: -1,
            isIndexing: false,
            indexProgress: 0,
          },
          false,
          "clearSearch"
        ),
    }),
    { name: "SharkView Search Store" }
  )
);
