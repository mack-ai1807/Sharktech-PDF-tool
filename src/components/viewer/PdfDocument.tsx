import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SharkLogo } from "@/components/ui/SharkLogo";
import type { PDFDocumentProxy, PageViewport } from "pdfjs-dist";
import { usePdfStore } from "@/stores/usePdfStore";
import { useViewerStore } from "@/stores/useViewerStore";
import { useUIStore } from "@/stores/useUIStore";
import { useFileOpen } from "@/hooks/useFileOpen";
import { PdfCanvas } from "./PdfCanvas";
import { AnnotationLayer } from "@/components/annotations/AnnotationLayer";
import { SignatureModal } from "@/components/signatures/SignatureModal";
import { screenToPdfRect } from "@/lib/pdf-coordinates";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageDim {
  width: number; // unscaled CSS px at zoom 1.0
  height: number;
}

interface SignatureTarget {
  pageIndex: number;
  clickX: number;
  clickY: number;
}


// ─── Drop zone ────────────────────────────────────────────────────────────────

function DropZone() {
  const [drag, setDrag] = useState(false);
  const { openFromBuffer } = useFileOpen();
  const setError = useViewerStore((s) => s.setError);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    file.arrayBuffer().then((buf) => openFromBuffer(buf, file.name));
  }

  return (
    <div
      data-testid="drop-zone"
      className="flex flex-col items-center justify-center h-full relative overflow-hidden dot-grid"
      style={{ background: "var(--canvas-bg)" }}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
    >
      {/* Radial ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-500"
        style={{
          background: drag
            ? "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(212,160,23,0.10) 0%, transparent 70%)"
            : "radial-gradient(ellipse 55% 42% at 50% 50%, rgba(212,160,23,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Drop target card */}
      <div
        className="drop-zone-card-enter relative flex flex-col items-center gap-7 px-16 py-14 rounded-3xl transition-all duration-300"
        style={{
          background: drag
            ? "rgba(212,160,23,0.06)"
            : "rgba(255,255,255,0.025)",
          border: `2px dashed ${drag ? "rgba(212,160,23,0.6)" : "rgba(255,255,255,0.09)"}`,
          backdropFilter: "blur(12px)",
          boxShadow: drag
            ? "0 0 60px rgba(212,160,23,0.12), inset 0 0 30px rgba(212,160,23,0.04)"
            : "0 8px 40px rgba(0,0,0,0.3)",
        }}
      >
        {/* Logo — bigger, prominent */}
        <SharkLogo className="h-20" />

        {/* Floating upload icon */}
        <div className={drag ? "" : "drop-zone-float"}>
          <svg
            className="w-14 h-14 transition-all duration-300"
            style={{ color: drag ? "#F5CC5A" : "rgba(255,255,255,0.18)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={0.9}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        {/* Text block */}
        <div className="drop-zone-text-enter text-center space-y-3">
          <p
            className="font-bold text-lg tracking-wide transition-colors duration-300"
            style={{
              color: drag ? "#F5CC5A" : "rgba(255,255,255,0.65)",
              letterSpacing: "0.02em",
            }}
          >
            {drag ? "Release to open PDF" : "Drop a PDF to get started"}
          </p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.28)" }}>
            or press{" "}
            <kbd
              className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-xs font-semibold"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.55)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              Ctrl+O
            </kbd>{" "}
            to browse files
          </p>

          {/* Feature pills */}
          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
            {["Highlight", "Annotate", "Sign", "Merge", "Split"].map((f) => (
              <span
                key={f}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-widest"
                style={{
                  background: "rgba(212,160,23,0.08)",
                  border: "1px solid rgba(212,160,23,0.15)",
                  color: "rgba(212,160,23,0.55)",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer brand */}
      <p
        className="absolute bottom-5 text-[10px] tracking-[0.24em] uppercase font-semibold"
        style={{ color: "rgba(212,160,23,0.2)" }}
      >
        SharkView · SharkTech Global · Free &amp; Open
      </p>
    </div>
  );
}

// ─── Loading view ─────────────────────────────────────────────────────────────

function LoadingView({ fileName }: { fileName: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 bg-surface-900">
      {/* Skeleton page mockup */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="skeleton-shimmer rounded-xl"
          style={{ width: 280, height: 360, opacity: 0.6 }}
        />
        <div className="flex flex-col items-center gap-2">
          <div className="skeleton-shimmer rounded-lg" style={{ width: 180, height: 10 }} />
          <div className="skeleton-shimmer rounded-lg" style={{ width: 120, height: 10 }} />
        </div>
      </div>
      {fileName && (
        <p className="text-sm animate-fade-in" style={{ color: "rgba(255,255,255,0.4)" }}>
          Loading <span style={{ color: "rgba(212,160,23,0.7)" }}>{fileName}</span>…
        </p>
      )}
    </div>
  );
}

// ─── Error view ───────────────────────────────────────────────────────────────

function ErrorView({ message }: { message: string }) {
  const closeFile = useViewerStore((s) => s.closeFile);
  const clearPdfDoc = usePdfStore((s) => s.setPdfDoc);

  function dismiss() {
    closeFile();
    clearPdfDoc(null);
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 bg-surface-900">
      <svg
        className="w-12 h-12 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
      <div className="text-center">
        <p className="text-red-400 font-medium">Failed to open PDF</p>
        <p className="text-xs text-surface-400 mt-1 max-w-xs px-4">{message}</p>
      </div>
      <button
        onClick={dismiss}
        className="px-4 py-1.5 text-sm bg-surface-700 hover:bg-surface-600
                   rounded transition-colors text-surface-100"
      >
        Dismiss
      </button>
    </div>
  );
}

// ─── Single-page wrapper ──────────────────────────────────────────────────────

interface PageWrapperProps {
  pdfDoc: PDFDocumentProxy;
  pageIndex: number;
  zoom: number;
  dim: PageDim;
  onPageRendered: (pageIndex: number, viewport: PageViewport) => void;
  onSignatureClick?: (pageIndex: number, clickX: number, clickY: number, viewport: PageViewport) => void;
  signatureMode: boolean;
  noteMode: boolean;
}

/**
 * Wraps PdfCanvas in a correctly-sized container.
 * Uses IntersectionObserver to defer rendering until the page enters the viewport.
 * Always renders page 0 immediately (above-the-fold).
 */
function PageWrapper({
  pdfDoc,
  pageIndex,
  zoom,
  dim,
  onPageRendered,
  onSignatureClick,
  signatureMode,
  noteMode,
}: PageWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [currentViewport, setCurrentViewport] = useState<PageViewport | null>(null);
  // Page 0 always visible — avoids double IntersectionObserver trigger
  const [inView, setInView] = useState(pageIndex === 0);

  const cssW = dim.width * zoom;
  const cssH = dim.height * zoom;

  useEffect(() => {
    if (inView) return; // already visible — skip observer
    const el = wrapperRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { rootMargin: "400px 0px" } // pre-load 400 px before entering view
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView]);

  const handleRendered = useCallback(
    (idx: number, vp: PageViewport) => {
      setCurrentViewport(vp);
      onPageRendered(idx, vp);
    },
    [onPageRendered]
  );

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!currentViewport) return;
    if (signatureMode && onSignatureClick) {
      const rect = e.currentTarget.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      const pdfRect = screenToPdfRect(
        new DOMRect(relX, relY, 0, 0),
        currentViewport
      );
      onSignatureClick(pageIndex, pdfRect.x, pdfRect.y, currentViewport);
    }
    // Note mode is handled inside AnnotationLayer's SVG click
  }

  const cursorClass = signatureMode
    ? "cursor-crosshair"
    : noteMode
      ? "cursor-cell"
      : "";

  return (
    <div
      ref={wrapperRef}
      data-page={pageIndex + 1}
      className={`relative mx-auto shadow-xl mb-3 flex-shrink-0 bg-white overflow-hidden annotation-layer-host
        ${cursorClass}`}
      style={{ width: cssW, height: cssH }}
      aria-label={`Page ${pageIndex + 1}`}
      onClick={handleClick}
    >
      {inView ? (
        <>
          <PdfCanvas
            pdfDoc={pdfDoc}
            pageIndex={pageIndex}
            zoomLevel={zoom}
            onPageRendered={handleRendered}
          />
          {currentViewport && (
            <AnnotationLayer
              pageIndex={pageIndex}
              viewport={currentViewport}
            />
          )}
        </>
      ) : (
        /* Placeholder shimmer while page is off-screen */
        <div className="absolute inset-0 skeleton-shimmer" />
      )}
    </div>
  );
}

// ─── PdfDocument ──────────────────────────────────────────────────────────────

/**
 * PdfDocument — scrollable multi-page PDF viewer.
 *
 * Subscribes to:
 *   - usePdfStore.pdfDoc  — live PDFDocumentProxy
 *   - useViewerStore      — zoom, currentPage, scrollMode, isLoading, error
 *
 * Renders:
 *   - DropZone when no file is open
 *   - LoadingView while PDF bytes are loading
 *   - ErrorView on corrupt/invalid file
 *   - Stacked PageWrappers (lazy via IntersectionObserver) otherwise
 */
export const PdfDocument: React.FC = () => {
  const pdfDoc = usePdfStore((s) => s.pdfDoc);
  const isLoading = useViewerStore((s) => s.isLoading);
  const error = useViewerStore((s) => s.error);
  const fileBuffer = useViewerStore((s) => s.fileBuffer);
  const fileName = useViewerStore((s) => s.fileName);
  const zoom = useViewerStore((s) => s.zoom);
  const zoomMode = useViewerStore((s) => s.zoomMode);
  const scrollMode = useViewerStore((s) => s.scrollMode);
  const currentPage = useViewerStore((s) => s.currentPage);
  const setZoom = useViewerStore((s) => s.setZoom);

  const toolbarMode = useUIStore((s) => s.toolbarMode);

  const containerRef = useRef<HTMLDivElement>(null);
  const [pageDims, setPageDims] = useState<PageDim[]>([]);
  const [signatureTarget, setSignatureTarget] = useState<SignatureTarget | null>(null);

  // ── Pre-load page dimensions (no rendering — very fast) ─────────────────

  useEffect(() => {
    if (!pdfDoc) {
      setPageDims([]);
      return;
    }

    let cancelled = false;

    async function loadDims() {
      if (!pdfDoc) return;
      const dims: PageDim[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const pg = await pdfDoc.getPage(i);
        const vp = pg.getViewport({ scale: 1 });
        dims.push({ width: vp.width, height: vp.height });
      }
      if (!cancelled) {
        setPageDims(dims);
        // Compute initial fit-width zoom from first page
        if (dims.length > 0 && containerRef.current) {
          const availW = containerRef.current.clientWidth - 48;
          setZoom(Math.max(0.1, Math.min(availW / dims[0].width, 5)));
        }
      }
    }

    loadDims();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, setZoom]);

  // ── ResizeObserver — recompute fit zoom on container resize ─────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container || pageDims.length === 0) return;

    const ro = new ResizeObserver(() => {
      if (zoomMode === "custom") return;
      const first = pageDims[0];
      const availW = container.clientWidth - 48;
      const availH = container.clientHeight - 48;
      if (zoomMode === "fitWidth")
        setZoom(Math.max(0.1, availW / first.width));
      if (zoomMode === "fitPage")
        setZoom(
          Math.max(0.1, Math.min(availW / first.width, availH / first.height))
        );
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, [pageDims, zoomMode, setZoom]);

  // ── Scroll to current page when toolbar nav / bookmark click fires ───────

  useEffect(() => {
    if (!containerRef.current || !pdfDoc) return;
    const el = containerRef.current.querySelector<HTMLElement>(
      `[data-page="${currentPage}"]`
    );
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage, pdfDoc]);

  // ── Ctrl+scroll zoom ─────────────────────────────────────────────────────

  const zoomIn = useViewerStore((s) => s.zoomIn);
  const zoomOut = useViewerStore((s) => s.zoomOut);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      e.deltaY < 0 ? zoomIn() : zoomOut();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomIn, zoomOut]);

  // ── Track visible page for toolbar page counter ──────────────────────────

  const goToPage = useViewerStore((s) => s.goToPage);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !pdfDoc) return;

    const obs = new IntersectionObserver(
      (entries) => {
        let best: { pg: number; ratio: number } | null = null;
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const pg = parseInt(
            (e.target as HTMLElement).dataset.page ?? "0",
            10
          );
          if (pg && (!best || e.intersectionRatio > best.ratio)) {
            best = { pg, ratio: e.intersectionRatio };
          }
        });
        if (best) goToPage((best as { pg: number }).pg);
      },
      { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    const timer = setTimeout(() => {
      container
        .querySelectorAll<HTMLElement>("[data-page]")
        .forEach((el) => obs.observe(el));
    }, 100);

    return () => {
      clearTimeout(timer);
      obs.disconnect();
    };
  }, [pdfDoc, pageDims.length, scrollMode, goToPage]);

  // ── onPageRendered callback (memoised — stable reference) ────────────────

  const handlePageRendered = useCallback(
    (_pageIndex: number, _viewport: PageViewport) => {
      // Hook for AnnotationLayer (Story 3) and thumbnail refresh (Story 2.3)
    },
    []
  );

  // ── Signature click handler ───────────────────────────────────────────────

  const handleSignatureClick = useCallback(
    (pageIndex: number, clickX: number, clickY: number, _viewport: PageViewport) => {
      setSignatureTarget({ pageIndex, clickX, clickY });
    },
    []
  );

  // ── Which pages to render based on scroll mode ───────────────────────────

  const pageIndices = useMemo(() => {
    if (!pdfDoc) return [];
    return scrollMode === "continuous"
      ? Array.from({ length: pdfDoc.numPages }, (_, i) => i)
      : [currentPage - 1]; // single-page mode: only active page
  }, [pdfDoc, scrollMode, currentPage]);

  // ── Conditional views ────────────────────────────────────────────────────

  if (error) return <ErrorView message={error} />;
  if (isLoading || (fileBuffer && !pdfDoc))
    return <LoadingView fileName={fileName} />;
  if (!fileBuffer) return <DropZone />;

  return (
    <>
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-surface-700 pdf-canvas-container"
        aria-label="PDF document"
      >
        <div className="py-6 flex flex-col items-center">
          {pageIndices.map((i) => {
            const dim = pageDims[i] ?? { width: 595, height: 842 }; // A4 fallback
            return (
              <PageWrapper
                key={`${i}-${zoom}`}
                pdfDoc={pdfDoc!}
                pageIndex={i}
                zoom={zoom}
                dim={dim}
                onPageRendered={handlePageRendered}
                onSignatureClick={handleSignatureClick}
                signatureMode={toolbarMode === "signature"}
                noteMode={toolbarMode === "note"}
              />
            );
          })}
        </div>
      </div>

      {/* Signature modal */}
      {signatureTarget && (
        <SignatureModal
          pageIndex={signatureTarget.pageIndex}
          clickX={signatureTarget.clickX}
          clickY={signatureTarget.clickY}
          onClose={() => setSignatureTarget(null)}
        />
      )}
    </>
  );
};
