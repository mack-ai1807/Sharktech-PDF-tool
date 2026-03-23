import React, { useEffect, useRef, useState, useCallback } from "react";
import { useViewerStore, type BookmarkItem } from "@/stores/useViewerStore";
import { thumbnailService } from "@/pdf/ThumbnailService";
import { usePdfStore } from "@/stores/usePdfStore";
import { SearchPanel } from "@/components/navigation/SearchPanel";
import { BookmarkTree } from "@/components/navigation/BookmarkTree";
import { ThumbnailStrip } from "@/components/navigation/ThumbnailStrip";

// ─── Bookmark tree ────────────────────────────────────────────────────────────

function BookmarkNode({
  item,
  depth = 0,
}: {
  item: BookmarkItem;
  depth?: number;
}) {
  const [open, setOpen]  = useState(depth === 0);
  const goToPage         = useViewerStore((s) => s.goToPage);
  const hasChildren      = item.children.length > 0;

  return (
    <li>
      <div className="flex items-start">
        {hasChildren && (
          <button
            className="flex-shrink-0 w-4 h-5 flex items-center justify-center
                       text-shark-500 hover:text-surface-300 transition-colors"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Collapse" : "Expand"}
          >
            <svg
              className={`w-2.5 h-2.5 transition-transform ${open ? "rotate-90" : ""}`}
              fill="currentColor"
              viewBox="0 0 6 10"
            >
              <path
                d="M1 1l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </button>
        )}
        <button
          className="flex-1 text-left py-1 text-xs text-surface-200
                     hover:bg-shark-800 hover:text-surface-50 rounded
                     transition-colors duration-100 truncate"
          style={{ paddingLeft: hasChildren ? "4px" : `${16 + depth * 12}px` }}
          onClick={() => goToPage(item.pageNumber)}
          title={`${item.title} — Page ${item.pageNumber}`}
        >
          {item.title}
        </button>
      </div>
      {hasChildren && open && (
        <ul className="ml-3">
          {item.children.map((child, i) => (
            <BookmarkNode key={i} item={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function BookmarksPanel() {
  const bookmarks = useViewerStore((s) => s.bookmarks);
  const isLoading = useViewerStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-20 text-shark-500 text-xs">
        Loading…
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 gap-2 text-shark-500">
        <svg
          className="w-8 h-8 opacity-40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        <p className="text-xs text-center px-4">No bookmarks in this document</p>
      </div>
    );
  }

  return (
    <nav aria-label="Document bookmarks" className="py-1">
      <ul>
        {bookmarks.map((item, i) => (
          <BookmarkNode key={i} item={item} />
        ))}
      </ul>
    </nav>
  );
}

// ─── Thumbnail item ───────────────────────────────────────────────────────────

function ThumbnailItem({
  pageNumber,
  isCurrent,
  onNavigate,
}: {
  pageNumber: number;
  isCurrent: boolean;
  onNavigate: (page: number) => void;
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const itemRef  = useRef<HTMLButtonElement>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (isCurrent && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isCurrent]);

  const request = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    const cached = thumbnailService.request(pageNumber, (_, url) => {
      setImgSrc(url);
    });
    if (cached) setImgSrc(cached);
  }, [pageNumber]);

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          request();
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [request]);

  return (
    <button
      ref={itemRef}
      className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all duration-100
        ${
          isCurrent
            ? "text-[#F5CC5A]"
            : "bg-shark-800 text-surface-400 hover:bg-shark-700 hover:text-surface-200 hover:scale-[1.02]"
        }`}
      style={isCurrent ? {
        background: "rgba(212,160,23,0.08)",
        boxShadow: "0 0 0 1.5px rgba(212,160,23,0.5)",
      } : {}}
      onClick={() => onNavigate(pageNumber)}
      aria-label={`Go to page ${pageNumber}`}
      aria-current={isCurrent ? "page" : undefined}
    >
      <div className="w-full aspect-[3/4] bg-shark-700 rounded overflow-hidden
                      flex items-center justify-center">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={`Page ${pageNumber}`}
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <span className="text-shark-500 text-[9px] animate-pulse">…</span>
        )}
      </div>
      <span className="text-[10px] tabular-nums">{pageNumber}</span>
    </button>
  );
}

function ThumbnailsPanel() {
  const totalPages = useViewerStore((s) => s.totalPages);
  const currentPage = useViewerStore((s) => s.currentPage);
  const goToPage    = useViewerStore((s) => s.goToPage);

  if (totalPages === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-shark-500 text-xs">
        No document open
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-2" role="list" aria-label="Page thumbnails">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
        <ThumbnailItem
          key={pg}
          pageNumber={pg}
          isCurrent={pg === currentPage}
          onNavigate={goToPage}
        />
      ))}
    </div>
  );
}

// ─── Sidebar shell ────────────────────────────────────────────────────────────

/** Tabs supported by this sidebar. "search" is added for Story 2.1. */
type FullSidebarTab = "bookmarks" | "thumbnails" | "search" | "none";

const TAB_LABELS: Record<Exclude<FullSidebarTab, "none">, string> = {
  bookmarks: "Bookmarks",
  thumbnails: "Pages",
  search: "Search",
};

export const Sidebar: React.FC = () => {
  const sidebarTab    = useViewerStore((s) => s.sidebarTab) as FullSidebarTab;
  const setSidebarTab = useViewerStore((s) => s.setSidebarTab) as (tab: FullSidebarTab) => void;
  const fileBuffer    = useViewerStore((s) => s.fileBuffer);
  const currentPage   = useViewerStore((s) => s.currentPage);
  const goToPage      = useViewerStore((s) => s.goToPage);
  const bookmarks     = useViewerStore((s) => s.bookmarks);
  const pdfDoc        = usePdfStore((s) => s.pdfDoc);

  if (sidebarTab === "none") return null;

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col bg-shark-900 border-r border-shark-800
                 overflow-hidden animate-slide-in"
      aria-label="Document sidebar"
    >
      {/* ── Tab bar ─────────────────────────────────────────── */}
      <div className="flex border-b border-shark-800 flex-shrink-0" role="tablist">
        {(["bookmarks", "thumbnails", "search"] as const).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={sidebarTab === tab}
            className={`flex-1 px-2 py-2.5 text-[10px] font-semibold uppercase tracking-widest
              border-b-2 transition-all duration-150 cursor-pointer
              ${
                sidebarTab === tab
                  ? "border-[#D4A017]"
                  : "text-shark-400 border-transparent hover:text-surface-100 hover:border-shark-700"
              }`}
          style={sidebarTab === tab ? {
            color: "#F5CC5A",
            textShadow: "0 0 12px rgba(212,160,23,0.4)",
          } : {}}
            onClick={() => setSidebarTab(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* ── Panel content ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {sidebarTab === "search" ? (
          /* Search panel manages its own "no doc" state */
          <SearchPanel />
        ) : !fileBuffer ? (
          <div className="flex items-center justify-center h-20 text-shark-500 text-xs">
            No document open
          </div>
        ) : sidebarTab === "bookmarks" ? (
          pdfDoc ? (
            <BookmarkTree
              outline={bookmarks as unknown as import("@/components/navigation/BookmarkTree").OutlineItem[]}
              pdfDoc={pdfDoc}
              currentPage={currentPage}
            />
          ) : (
            <BookmarksPanel />
          )
        ) : pdfDoc ? (
          <ThumbnailStrip
            pdfDoc={pdfDoc}
            currentPage={currentPage}
            onNavigate={goToPage}
          />
        ) : (
          <ThumbnailsPanel />
        )}
      </div>
    </aside>
  );
};
