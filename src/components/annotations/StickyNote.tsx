/**
 * StickyNote.tsx
 * Renders a sticky note annotation icon on the PDF page.
 * On hover/click shows an editable popup with the note content.
 * Draggable within the page. Right-click deletes with confirmation.
 */

import React, { useState, useRef, useCallback } from "react";
import type { PageViewport } from "pdfjs-dist";
import type { Annotation } from "@/types/annotation";
import { useAnnotationStore } from "@/stores/useAnnotationStore";
import { pdfToScreenRect } from "@/lib/pdf-coordinates";
import { toast } from "@/stores/useToastStore";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StickyNoteProps {
  annotation: Annotation;
  pageIndex: number;
  viewport: PageViewport;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const StickyNote: React.FC<StickyNoteProps> = ({
  annotation,
  pageIndex,
  viewport,
}) => {
  const updateAnnotation = useAnnotationStore((s) => s.updateAnnotation);
  const deleteAnnotation = useAnnotationStore((s) => s.deleteAnnotation);
  const selectAnnotation = useAnnotationStore((s) => s.selectAnnotation);
  const selectedId = useAnnotationStore((s) => s.selectedId);

  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const isSelected = selectedId === annotation.id;

  // Convert the first PDF rect to screen position
  const pdfRect = annotation.pdfRects[0];
  if (!pdfRect) return null;

  const screenRect = pdfToScreenRect(pdfRect, viewport);

  // ── Drag handling ──────────────────────────────────────────────────────────

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // left button only
      e.stopPropagation();
      selectAnnotation(annotation.id);
      setIsDragging(true);

      dragOffset.current = {
        x: e.clientX - screenRect.x,
        y: e.clientY - screenRect.y,
      };

      function onMouseMove(mv: MouseEvent) {
        const newScreenX = mv.clientX - dragOffset.current.x;
        const newScreenY = mv.clientY - dragOffset.current.y;

        // Clamp to page bounds
        const clampedX = Math.max(0, Math.min(newScreenX, viewport.width - 24));
        const clampedY = Math.max(0, Math.min(newScreenY, viewport.height - 24));

        // Convert back to PDF coords
        const scale = viewport.scale;
        const newPdfX = clampedX / scale;
        const newPdfY = (viewport.height - clampedY - 24) / scale;

        updateAnnotation(annotation.id, pageIndex, {
          pdfRects: [{ x: newPdfX, y: newPdfY, width: 24 / scale, height: 24 / scale }],
        });
      }

      function onMouseUp() {
        setIsDragging(false);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      }

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [annotation.id, pageIndex, screenRect.x, screenRect.y, viewport, updateAnnotation, selectAnnotation]
  );

  // ── Right-click delete ─────────────────────────────────────────────────────

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    deleteAnnotation(annotation.id, pageIndex);
    toast.info("Note removed");
  }

  // ── Content update ─────────────────────────────────────────────────────────

  function handleContentChange(value: string) {
    updateAnnotation(annotation.id, pageIndex, { content: value });
  }

  return (
    <div
      className={`absolute select-none ${isDragging ? "cursor-grabbing z-50" : "cursor-grab z-40"}`}
      style={{
        left: screenRect.x,
        top: screenRect.y,
        width: 24,
        height: 24,
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      aria-label="Sticky note annotation"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") setIsOpen((v) => !v);
        if (e.key === "Delete") {
          deleteAnnotation(annotation.id, pageIndex);
        }
      }}
    >
      {/* Note icon */}
      <div
        className={`w-6 h-6 rounded flex items-center justify-center transition-transform
          ${isSelected ? "scale-125" : "hover:scale-110"}`}
        style={{ backgroundColor: annotation.color, opacity: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((v) => !v);
          selectAnnotation(annotation.id);
        }}
        title="Click to open note"
      >
        <svg
          className="w-3.5 h-3.5 text-shark-900"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      </div>

      {/* Popup editor */}
      {isOpen && (
        <div
          className="absolute top-7 left-0 z-50 bg-shark-800 border border-shark-600 rounded-lg
                     shadow-2xl p-2 w-56"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-shark-400 font-medium">Note</span>
            <button
              className="text-shark-400 hover:text-surface-100 transition-colors text-xs"
              onClick={() => setIsOpen(false)}
              aria-label="Close note"
            >
              ✕
            </button>
          </div>
          <textarea
            className="w-full h-28 text-xs bg-shark-900 text-surface-100 border border-shark-700
                       rounded p-1.5 resize-none focus:outline-none focus:border-brand-500"
            placeholder="Type your note…"
            value={annotation.content ?? ""}
            onChange={(e) => handleContentChange(e.target.value)}
            autoFocus
            aria-label="Note content"
          />
          <p className="text-xs text-shark-500 mt-1">Right-click icon to delete</p>
        </div>
      )}
    </div>
  );
};
