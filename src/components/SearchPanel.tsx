/**
 * SearchPanel.tsx
 * Floating search bar overlay (shown via Ctrl+F / toolbar search button).
 * Uses the real PDF text search index (useSearchStore + buildSearchIndex).
 * Replaces the old dummy implementation that used viewerStore.searchResults.
 */
import React, { useRef, useEffect } from "react";
import { useSearchStore } from "@/stores/useSearchStore";
import { usePdfStore } from "@/stores/usePdfStore";
import { useViewerStore } from "@/stores/useViewerStore";
import { buildSearchIndex, searchIndex } from "@/lib/pdf-search";

export function SearchPanel() {
  const {
    query,
    caseSensitive,
    hits,
    activeHitIndex,
    isIndexing,
    indexProgress,
    setQuery,
    setCaseSensitive,
    setHits,
    setIsIndexing,
    setIndexProgress,
    nextHit,
    prevHit,
    clearSearch,
  } = useSearchStore();

  const isSearchOpen = useViewerStore((s) => s.isSearchOpen);
  const closeSearch  = useViewerStore((s) => s.closeSearch);
  const pdfDoc       = usePdfStore((s) => s.pdfDoc);

  const inputRef    = useRef<HTMLInputElement>(null);
  const indexRef    = useRef<Awaited<ReturnType<typeof buildSearchIndex>> | null>(null);
  const buildingRef = useRef(false);

  // Auto-focus when panel opens
  useEffect(() => {
    if (isSearchOpen) inputRef.current?.focus();
  }, [isSearchOpen]);

  // Build index when PDF document changes
  useEffect(() => {
    if (!pdfDoc || buildingRef.current) return;
    buildingRef.current = true;
    setIsIndexing(true);
    setIndexProgress(0);

    buildSearchIndex(pdfDoc, (indexed, total) => {
      setIndexProgress(Math.round((indexed / total) * 100));
    })
      .then((idx) => {
        indexRef.current = idx;
        setIsIndexing(false);
        // Re-run current query with the new index
        const { query: q, caseSensitive: cs } = useSearchStore.getState();
        if (q.trim()) setHits(searchIndex(idx, q, cs));
      })
      .catch(() => setIsIndexing(false))
      .finally(() => { buildingRef.current = false; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDoc]);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (!indexRef.current) { setHits([]); return; }
    setHits(q.trim() ? searchIndex(indexRef.current, q, caseSensitive) : []);
  }

  function handleCaseSensitiveToggle() {
    const newCS = !caseSensitive;
    setCaseSensitive(newCS);
    if (!indexRef.current || !query.trim()) return;
    setHits(searchIndex(indexRef.current, query, newCS));
  }

  function handleClose() {
    clearSearch();
    closeSearch();
  }

  if (!isSearchOpen) return null;

  const totalHits = hits.length;

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 border-b flex-shrink-0 animate-fade-in"
      style={{
        background: "rgba(9,9,11,0.97)",
        borderColor: "rgba(212,160,23,0.15)",
        backdropFilter: "blur(12px)",
      }}
      role="search"
      aria-label="Search document"
    >
      {/* Search input */}
      <div className="relative flex items-center">
        <svg
          className="absolute left-2.5 w-3.5 h-3.5 pointer-events-none"
          style={{ color: "rgba(255,255,255,0.3)" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Search in document…"
          aria-label="Search query"
          className="pl-8 pr-3 py-1.5 w-60 text-xs rounded-lg text-white
                     placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#D4A017]/50 transition-all"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          onChange={handleQueryChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); e.shiftKey ? prevHit() : nextHit(); }
            if (e.key === "Escape") handleClose();
          }}
        />
      </div>

      {/* Case-sensitive toggle */}
      <button
        className="w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center"
        style={{
          background: caseSensitive ? "rgba(212,160,23,0.2)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${caseSensitive ? "rgba(212,160,23,0.4)" : "rgba(255,255,255,0.07)"}`,
          color: caseSensitive ? "#D4A017" : "rgba(255,255,255,0.35)",
        }}
        onClick={handleCaseSensitiveToggle}
        title="Case-sensitive"
        aria-label="Toggle case-sensitive search"
        aria-pressed={caseSensitive}
      >
        Aa
      </button>

      {/* Match count / indexing status */}
      <span className="text-xs tabular-nums w-24 flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>
        {isIndexing ? (
          `Indexing… ${indexProgress}%`
        ) : query.trim() ? (
          totalHits === 0
            ? <span style={{ color: "#f87171" }}>No results</span>
            : <>{activeHitIndex + 1} / {totalHits}</>
        ) : null}
      </span>

      {/* Prev */}
      <button
        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-25"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}
        onClick={prevHit}
        disabled={totalHits === 0}
        title="Previous match (Shift+Enter)"
        aria-label="Previous match"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Next */}
      <button
        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all disabled:opacity-25"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}
        onClick={nextHit}
        disabled={totalHits === 0}
        title="Next match (Enter)"
        aria-label="Next match"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Close */}
      <button
        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all ml-1"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}
        onClick={handleClose}
        title="Close (Esc)"
        aria-label="Close search"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
