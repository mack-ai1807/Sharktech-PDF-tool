/**
 * ThumbnailStrip.tsx
 * Lazy-loaded page thumbnail sidebar for Story 2.3.
 * Uses IntersectionObserver — only visible thumbnails render.
 * Clicking a thumbnail navigates to that page.
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

// ─── Constants ────────────────────────────────────────────────────────────────

const THUMBNAIL_WIDTH = 110; // CSS pixels

// ─── ThumbnailItem ────────────────────────────────────────────────────────────

interface ThumbnailItemProps {
  pdfDoc: PDFDocumentProxy;
  pageIndex: number;
  isCurrent: boolean;
  onClick: (pageNumber: number) => void;
}

function ThumbnailItem({ pdfDoc, pageIndex, isCurrent, onClick }: ThumbnailItemProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const containerRef = useRef<HTMLButtonElement>(null);
  const renderingRef = useRef(false);

  const renderThumbnail = useCallback(async () => {
    if (renderingRef.current || rendered) return;
    renderingRef.current = true;

    try {
      const page = await pdfDoc.getPage(pageIndex + 1);
      const naturalVp = page.getViewport({ scale: 1 });
      const scale = THUMBNAIL_WIDTH / naturalVp.width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      await page.render({ canvasContext: ctx, viewport }).promise;

      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      setImgSrc(dataUrl);
      setRendered(true);

      // Clean up page proxy to free memory
      page.cleanup();
    } catch {
      // Silently fail — page stays as placeholder
    } finally {
      renderingRef.current = false;
    }
  }, [pdfDoc, pageIndex, rendered]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !rendered) {
          void renderThumbnail();
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [renderThumbnail, rendered]);

  const pageNumber = pageIndex + 1;

  return (
    <button
      ref={containerRef}
      className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all duration-150
        ${isCurrent
          ? "ring-2 ring-[#D4A017] bg-[#D4A017]/10 text-[#F5CC5A]"
          : "bg-shark-800 text-surface-400 hover:bg-shark-700 hover:text-surface-200 hover:scale-[1.03]"
        }`}
      onClick={() => onClick(pageNumber)}
      aria-label={`Go to page ${pageNumber}`}
      aria-current={isCurrent ? "page" : undefined}
    >
      {/* Thumbnail image / placeholder */}
      <div
        className="relative w-full bg-shark-700 rounded overflow-hidden flex items-center justify-center"
        style={{ width: THUMBNAIL_WIDTH, aspectRatio: "3/4" }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={`Page ${pageNumber} thumbnail`}
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 skeleton-shimmer" />
        )}
      </div>

      {/* Page number label */}
      <span className="text-[10px] tabular-nums">{pageNumber}</span>
    </button>
  );
}

// ─── ThumbnailStrip ───────────────────────────────────────────────────────────

export interface ThumbnailStripProps {
  pdfDoc: PDFDocumentProxy;
  currentPage: number;
  onNavigate: (pageNumber: number) => void;
}

export const ThumbnailStrip: React.FC<ThumbnailStripProps> = ({
  pdfDoc,
  currentPage,
  onNavigate,
}) => {
  const pageCount = pdfDoc.numPages;

  if (pageCount === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-shark-500 text-xs">
        No pages
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 gap-2 p-2"
      role="list"
      aria-label="Page thumbnails"
    >
      {Array.from({ length: pageCount }, (_, i) => (
        <ThumbnailItem
          key={i}
          pdfDoc={pdfDoc}
          pageIndex={i}
          isCurrent={i + 1 === currentPage}
          onClick={onNavigate}
        />
      ))}
    </div>
  );
};
