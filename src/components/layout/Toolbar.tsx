import React, { useRef, useState } from "react";
import { useViewerStore } from "@/stores/useViewerStore";
import { useUIStore, type ToolbarMode } from "@/stores/useUIStore";
import { useAnnotationStore } from "@/stores/useAnnotationStore";
import { useSaveAnnotations } from "@/hooks/useSaveAnnotations";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { HelpTooltip } from "@/components/ui/HelpTooltip";
import { SharkLogo } from "@/components/ui/SharkLogo";
import { HIGHLIGHT_COLORS } from "@/types/annotation";
import { MergeDialog } from "@/components/operations/MergeDialog";
import { SplitDialog } from "@/components/operations/SplitDialog";
import { useFileOpen } from "@/hooks/useFileOpen";

// ─── Icon helper ──────────────────────────────────────────────────────────────

function Icon({ path, className = "w-4 h-4" }: { path: string; className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

// ─── Separator ────────────────────────────────────────────────────────────────

function Sep() {
  return <div className="w-px h-5 mx-1.5 flex-shrink-0 rounded-full" style={{ background: "rgba(255,255,255,0.09)" }} aria-hidden="true" />;
}

// ─── Page input ───────────────────────────────────────────────────────────────

function PageInput() {
  const currentPage = useViewerStore((s) => s.currentPage);
  const totalPages  = useViewerStore((s) => s.totalPages);
  const goToPage    = useViewerStore((s) => s.goToPage);
  const ref = useRef<HTMLInputElement>(null);

  function commit() {
    const val = parseInt(ref.current?.value ?? "", 10);
    if (!isNaN(val)) goToPage(val);
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-surface-300">
      <input
        ref={ref}
        key={currentPage}
        defaultValue={currentPage}
        className="w-10 text-center rounded-lg py-0.5 tabular-nums text-sm
                   text-white focus:outline-none focus:ring-1 focus:ring-[#D4A017]/60"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            if (ref.current) ref.current.value = String(currentPage);
            ref.current?.blur();
          }
        }}
        onBlur={commit}
        aria-label="Current page"
      />
      <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
      <span className="tabular-nums text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{totalPages || "—"}</span>
    </div>
  );
}

// ─── Zoom control ─────────────────────────────────────────────────────────────

const ZOOM_PRESETS = [
  { label: "Fit Width", value: "fitWidth" },
  { label: "Fit Page",  value: "fitPage"  },
  { label: "50%",       value: 0.5  },
  { label: "75%",       value: 0.75 },
  { label: "100%",      value: 1.0  },
  { label: "125%",      value: 1.25 },
  { label: "150%",      value: 1.5  },
  { label: "200%",      value: 2.0  },
  { label: "300%",      value: 3.0  },
  { label: "400%",      value: 4.0  },
];

function ZoomControl() {
  const zoom     = useViewerStore((s) => s.zoom);
  const zoomMode = useViewerStore((s) => s.zoomMode);
  const setZoom  = useViewerStore((s) => s.setZoom);
  const setZoomMode = useViewerStore((s) => s.setZoomMode);
  const zoomIn   = useViewerStore((s) => s.zoomIn);
  const zoomOut  = useViewerStore((s) => s.zoomOut);

  const displayLabel =
    zoomMode === "fitWidth"
      ? "Fit Width"
      : zoomMode === "fitPage"
        ? "Fit Page"
        : `${Math.round(zoom * 100)}%`;

  return (
    <div className="flex items-center gap-0.5">
      <Tooltip content="Zoom out (Ctrl+−)" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          onClick={zoomOut}
          aria-label="Zoom out"
          className="toolbar-btn w-8 h-8 p-0"
        >
          <Icon path="M20 12H4" />
        </Button>
      </Tooltip>

      <select
        value={zoomMode !== "custom" ? zoomMode : zoom}
        className="h-7 px-2 text-xs rounded-lg text-white focus:outline-none cursor-pointer"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        aria-label="Zoom level"
        onChange={(e) => {
          const v = e.target.value;
          if (v === "fitWidth" || v === "fitPage") setZoomMode(v);
          else setZoom(Number(v));
        }}
      >
        <option value={zoomMode !== "custom" ? zoomMode : zoom}>
          {displayLabel}
        </option>
        {ZOOM_PRESETS.map((p) => (
          <option key={p.label} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      <Tooltip content="Zoom in (Ctrl++)" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          onClick={zoomIn}
          aria-label="Zoom in"
          className="toolbar-btn w-8 h-8 p-0"
        >
          <Icon path="M12 4v16m8-8H4" />
        </Button>
      </Tooltip>
    </div>
  );
}

// ─── Tool mode buttons ────────────────────────────────────────────────────────

interface ToolBtn {
  mode: ToolbarMode;
  icon: string;
  label: string;
  shortcut: string;
}

const TOOL_BUTTONS: ToolBtn[] = [
  {
    mode:     "highlight",
    icon:     "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
    label:    "Highlight text",
    shortcut: "H",
  },
  {
    mode:     "underline",
    icon:     "M7 8h10M7 12h10M7 16h10M7 20h10",
    label:    "Underline text",
    shortcut: "U",
  },
  {
    mode:     "strikethrough",
    icon:     "M7 12h10M9 6h6M9 18h6",
    label:    "Strikethrough text",
    shortcut: "X",
  },
  {
    mode:     "note",
    icon:     "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
    label:    "Add sticky note",
    shortcut: "N",
  },
  {
    mode:     "signature",
    icon:     "M15.232 5.232l3.536 3.536M9 11l6.536-6.536a2.5 2.5 0 013.536 3.536L12.536 14.5 9 15l.5-3.5z",
    label:    "Add signature",
    shortcut: "S",
  },
];

function HighlightColorPicker() {
  const highlightColor    = useUIStore((s) => s.highlightColor);
  const setHighlightColor = useUIStore((s) => s.setHighlightColor);
  const toolbarMode       = useUIStore((s) => s.toolbarMode);

  // Only visible when highlight tool is active
  if (toolbarMode !== "highlight") return null;

  return (
    <div className="flex items-center gap-1 ml-1.5" role="group" aria-label="Highlight color">
      {HIGHLIGHT_COLORS.map(({ label, value }) => (
        <Tooltip key={value} content={label} side="bottom">
          <button
            className={`w-5 h-5 rounded-full transition-all duration-150
              ${highlightColor === value
                ? "scale-125 ring-2 ring-white/70 ring-offset-1 ring-offset-transparent"
                : "opacity-70 hover:opacity-100 hover:scale-110"}`}
            style={{ backgroundColor: value }}
            onClick={() => setHighlightColor(value)}
            aria-label={`Highlight color: ${label}`}
            aria-pressed={highlightColor === value}
          />
        </Tooltip>
      ))}
    </div>
  );
}

function ToolModeButtons() {
  const toolbarMode    = useUIStore((s) => s.toolbarMode);
  const setToolbarMode = useUIStore((s) => s.setToolbarMode);

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Annotation tools">
      {TOOL_BUTTONS.map(({ mode, icon, label, shortcut }) => (
        <Tooltip key={mode} content={`${label} (${shortcut})`} side="bottom">
          <Button
            variant="ghost"
            size="sm"
            active={toolbarMode === mode}
            onClick={() =>
              setToolbarMode(toolbarMode === mode ? "select" : mode)
            }
            aria-pressed={toolbarMode === mode}
            aria-label={label}
            className="toolbar-btn w-8 h-8 p-0"
          >
            <Icon path={icon} />
          </Button>
        </Tooltip>
      ))}
      <HighlightColorPicker />
    </div>
  );
}

// ─── Save buttons ─────────────────────────────────────────────────────────────

function SaveButtons() {
  const fileBuffer = useViewerStore((s) => s.fileBuffer);
  const isDirty = useAnnotationStore((s) => s.isDirty);
  const { save, saveAs, isSaving } = useSaveAnnotations();

  const hasFile = !!fileBuffer;

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Save controls">
      <Tooltip content="Save (Ctrl+S)" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void save()}
          disabled={!hasFile || isSaving}
          aria-label="Save PDF"
          className="w-8 h-8 p-0 relative"
        >
          <Icon path="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          {isDirty && (
            <span
              className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-400"
              aria-label="Unsaved changes"
            />
          )}
        </Button>
      </Tooltip>
      <Tooltip content="Save As…" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void saveAs()}
          disabled={!hasFile || isSaving}
          aria-label="Save PDF as"
          className="toolbar-btn w-8 h-8 p-0"
        >
          <Icon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </Button>
      </Tooltip>
    </div>
  );
}

// ─── Main Toolbar ─────────────────────────────────────────────────────────────

export const Toolbar: React.FC = () => {
  const fileName     = useViewerStore((s) => s.fileName);
  const fileBuffer   = useViewerStore((s) => s.fileBuffer);
  const isDirty      = useAnnotationStore((s) => s.isDirty);
  const currentPage  = useViewerStore((s) => s.currentPage);
  const totalPages   = useViewerStore((s) => s.totalPages);
  const isDarkMode   = useViewerStore((s) => s.isDarkMode);
  const isSearchOpen = useViewerStore((s) => s.isSearchOpen);
  const sidebarTab   = useViewerStore((s) => s.sidebarTab);

  const goToFirst      = useViewerStore((s) => s.goToFirst);
  const goToLast       = useViewerStore((s) => s.goToLast);
  const prevPage       = useViewerStore((s) => s.prevPage);
  const nextPage       = useViewerStore((s) => s.nextPage);
  const toggleSidebar  = useViewerStore((s) => s.toggleSidebar);
  const openSearch     = useViewerStore((s) => s.openSearch);
  const toggleDarkMode = useViewerStore((s) => s.toggleDarkMode);

  const hasFile = !!fileBuffer;

  const [showMerge, setShowMerge] = useState(false);
  const [showSplit, setShowSplit] = useState(false);

  const { openNativeDialog } = useFileOpen();

  function handleOpenFile() {
    void openNativeDialog();
  }

  return (
    <>
    <header
      data-testid="toolbar"
      className="toolbar-glass flex items-center gap-1 px-3 h-[56px] flex-shrink-0 select-none z-10"
      role="toolbar"
      aria-label="PDF viewer controls"
    >
      {/* ── Logo ────────────────────────────────────────────── */}
      <SharkLogo className="h-8 mr-2 flex-shrink-0" />

      <Sep />

      {/* ── Open file ──────────────────────────────────────── */}
      <Tooltip content="Open PDF (Ctrl+O)" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenFile}
          aria-label="Open PDF file"
          className="toolbar-btn w-8 h-8 p-0"
        >
          <Icon path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </Button>
      </Tooltip>

      {/* ── Sidebar toggle ──────────────────────────────────── */}
      <Tooltip content="Toggle sidebar" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          active={sidebarTab !== "none"}
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          aria-pressed={sidebarTab !== "none"}
          className="toolbar-btn w-8 h-8 p-0"
        >
          <Icon path="M4 6h16M4 12h8m-8 6h16" />
        </Button>
      </Tooltip>

      <Sep />

      {/* ── Navigation ─────────────────────────────────────── */}
      <Tooltip content="First page" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToFirst}
          disabled={!hasFile || currentPage <= 1}
          aria-label="Go to first page"
          className="toolbar-btn w-8 h-8 p-0"
        >
          <Icon path="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </Button>
      </Tooltip>

      <Tooltip content="Previous page (↑)" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevPage}
          disabled={!hasFile || currentPage <= 1}
          aria-label="Previous page"
          className="toolbar-btn w-8 h-8 p-0"
        >
          <Icon path="M15 19l-7-7 7-7" />
        </Button>
      </Tooltip>

      <PageInput />

      <Tooltip content="Next page (↓)" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          onClick={nextPage}
          disabled={!hasFile || currentPage >= totalPages}
          aria-label="Next page"
          className="toolbar-btn w-8 h-8 p-0"
        >
          <Icon path="M9 5l7 7-7 7" />
        </Button>
      </Tooltip>

      <Tooltip content="Last page" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToLast}
          disabled={!hasFile || currentPage >= totalPages}
          aria-label="Go to last page"
          className="toolbar-btn w-8 h-8 p-0"
        >
          <Icon path="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </Button>
      </Tooltip>

      <Sep />

      {/* ── Zoom ───────────────────────────────────────────── */}
      <ZoomControl />

      <Sep />

      {/* ── Tool modes ─────────────────────────────────────── */}
      <ToolModeButtons />

      <Sep />

      {/* ── Search ─────────────────────────────────────────── */}
      <Tooltip content="Search (Ctrl+F)" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          active={isSearchOpen}
          onClick={openSearch}
          disabled={!hasFile}
          aria-label="Open search"
          aria-pressed={isSearchOpen}
          className="toolbar-btn w-8 h-8 p-0"
        >
          <Icon path="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </Button>
      </Tooltip>

      <Sep />

      {/* ── PDF Operations ──────────────────────────────────── */}
      <Tooltip content="Merge PDFs" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMerge(true)}
          aria-label="Merge PDFs"
          className="toolbar-btn w-8 h-8 p-0"
        >
          <Icon path="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </Button>
      </Tooltip>
      <Tooltip content="Split PDF" side="bottom">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSplit(true)}
          disabled={!hasFile}
          aria-label="Split PDF"
          className="toolbar-btn w-8 h-8 p-0"
        >
          <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </Button>
      </Tooltip>

      <Sep />

      {/* ── Save / SaveAs ───────────────────────────────────── */}
      <SaveButtons />

      {/* ── File name (centre spacer) ───────────────────────── */}
      <div className="flex-1 min-w-0 px-4 flex items-center justify-center gap-2">
        {fileName && (
          <>
            {isDirty && (
              <span className="gold-pulse w-1.5 h-1.5 rounded-full flex-shrink-0" aria-label="Unsaved changes" />
            )}
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.38)" }} title={fileName}>
              {fileName}
            </p>
          </>
        )}
      </div>

      {/* ── Dark/light toggle ──────────────────────────────── */}
      <Tooltip content={isDarkMode ? "Switch to light mode" : "Switch to dark mode"} side="bottom">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleDarkMode}
          aria-label="Toggle dark/light mode"
          className="toolbar-btn w-8 h-8 p-0"
        >
          {isDarkMode ? (
            <Icon path="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          ) : (
            <Icon path="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          )}
        </Button>
      </Tooltip>

      {/* ── Help / keyboard shortcuts ───────────────────────── */}
      <HelpTooltip />
    </header>

    {/* ── Operation dialogs ─────────────────────────────── */}
    {showMerge && <MergeDialog onClose={() => setShowMerge(false)} />}
    {showSplit && <SplitDialog onClose={() => setShowSplit(false)} />}
    </>
  );
};
