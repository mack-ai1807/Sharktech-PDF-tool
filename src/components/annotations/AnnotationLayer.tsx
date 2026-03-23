/**
 * AnnotationLayer.tsx
 * SVG overlay absolutely positioned over PdfCanvas.
 * Renders all annotations for a given page.
 * Handles text selection → highlight/underline/strikethrough creation.
 * Handles click → note creation in note mode.
 */

import React, { useRef } from "react";
import type { PageViewport } from "pdfjs-dist";
import { useAnnotationStore } from "@/stores/useAnnotationStore";
import { useUIStore } from "@/stores/useUIStore";
import { toast } from "@/stores/useToastStore";
import { Highlight } from "./Highlight";
import { StickyNote } from "./StickyNote";
import { screenToPdfRect } from "@/lib/pdf-coordinates";
import { mergeClientRects, generateId } from "@/lib/annotation-utils";
import type { Annotation, AnnotationType } from "@/types/annotation";
import { SignaturePlacement } from "@/components/signatures/SignaturePlacement";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AnnotationLayerProps {
  /** 0-based page index */
  pageIndex: number;
  viewport: PageViewport;
}

// ─── Underline / Strikethrough SVG lines ──────────────────────────────────────

interface TextLineAnnotationProps {
  annotation: Annotation;
  viewport: PageViewport;
}

/** Renders underline (line at bottom of rect) or strikethrough (line at middle) */
function TextLineAnnotation({ annotation, viewport }: TextLineAnnotationProps) {
  const deleteAnnotation = useAnnotationStore((s) => s.deleteAnnotation);
  const selectedId = useAnnotationStore((s) => s.selectedId);

  const isSelected = selectedId === annotation.id;

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    deleteAnnotation(annotation.id, annotation.pageIndex);
    toast.info("Annotation removed");
  }

  const scale = viewport.scale;
  const viewH = viewport.height;

  return (
    <>
      {annotation.pdfRects.map((pdfRect, i) => {
        // Convert PDF rect to screen coords
        const sx = pdfRect.x * scale;
        const syTop = viewH - (pdfRect.y + pdfRect.height) * scale;
        const sw = pdfRect.width * scale;
        const sh = pdfRect.height * scale;

        const lineY =
          annotation.type === "underline"
            ? syTop + sh // bottom of rect
            : syTop + sh / 2; // middle of rect

        return (
          <line
            key={i}
            x1={sx}
            y1={lineY}
            x2={sx + sw}
            y2={lineY}
            stroke={annotation.color}
            strokeWidth={isSelected ? 2.5 : 1.5}
            strokeOpacity={isSelected ? 1 : 0.85}
            style={{ pointerEvents: "auto", cursor: "context-menu" }}
            onContextMenu={handleContextMenu}
            role="button"
            aria-label={`${annotation.type} annotation`}
          />
        );
      })}
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
  pageIndex,
  viewport,
}) => {
  const annotations = useAnnotationStore((s) => s.annotations[pageIndex] ?? []);
  const addAnnotation = useAnnotationStore((s) => s.addAnnotation);
  const toolbarMode = useUIStore((s) => s.toolbarMode);
  const highlightColor = useUIStore((s) => s.highlightColor);

  const svgRef = useRef<SVGSVGElement>(null);

  // Text-selection modes
  const textSelectionModes: string[] = ["highlight", "underline", "strikethrough"];
  const isTextSelectionMode = textSelectionModes.includes(toolbarMode);

  function handleMouseUp(e: React.MouseEvent) {
    if (!isTextSelectionMode) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const clientRects = Array.from(range.getClientRects()).map(
      (r) => new DOMRect(r.left, r.top, r.width, r.height)
    );

    if (clientRects.length === 0) return;

    const svgBounds = svgRef.current?.getBoundingClientRect();
    if (!svgBounds) return;

    const relativeRects = mergeClientRects(
      clientRects.map(
        (r) =>
          new DOMRect(
            r.left - svgBounds.left,
            r.top - svgBounds.top,
            r.width,
            r.height
          )
      )
    );

    if (relativeRects.length === 0) return;

    const pdfRects = relativeRects.map((r) => screenToPdfRect(r, viewport));

    const annotation: Annotation = {
      id: generateId(),
      type: toolbarMode as AnnotationType,
      pageIndex,
      color: highlightColor,
      opacity: 0.4,
      pdfRects,
      createdAt: Date.now(),
    };

    addAnnotation(annotation);
    selection.removeAllRanges();
    e.stopPropagation();
  }

  // Note creation via click (handled in PdfDocument, but also here for SVG layer)
  function handleSvgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (toolbarMode !== "note") return;
    const svgBounds = svgRef.current?.getBoundingClientRect();
    if (!svgBounds) return;

    const relX = e.clientX - svgBounds.left;
    const relY = e.clientY - svgBounds.top;

    const pdfPos = screenToPdfRect(new DOMRect(relX, relY, 0, 0), viewport);

    const annotation: Annotation = {
      id: generateId(),
      type: "note",
      pageIndex,
      color: "#FFD700",
      opacity: 1,
      pdfRects: [{ x: pdfPos.x, y: pdfPos.y, width: 24, height: 24 }],
      content: "",
      createdAt: Date.now(),
    };

    addAnnotation(annotation);
    e.stopPropagation();
  }

  // Separate annotation types for rendering
  const highlightAnnotations = annotations.filter((a) => a.type === "highlight");
  const textLineAnnotations = annotations.filter(
    (a) => a.type === "underline" || a.type === "strikethrough"
  );
  const noteAnnotations = annotations.filter((a) => a.type === "note");
  const signatureAnnotations = annotations.filter((a) => a.type === "signature");

  const svgPointerEvents =
    isTextSelectionMode || toolbarMode === "note" ? "auto" : "none";

  return (
    <div
      className="absolute inset-0"
      style={{ width: viewport.width, height: viewport.height }}
    >
      <svg
        ref={svgRef}
        className="absolute inset-0 pointer-events-none"
        width={viewport.width}
        height={viewport.height}
        aria-label={`Annotation layer page ${pageIndex + 1}`}
        onMouseUp={handleMouseUp}
        onClick={handleSvgClick}
        style={{ pointerEvents: svgPointerEvents }}
      >
        {highlightAnnotations.map((ann) => (
          <Highlight key={ann.id} annotation={ann} viewport={viewport} />
        ))}
        {textLineAnnotations.map((ann) => (
          <TextLineAnnotation key={ann.id} annotation={ann} viewport={viewport} />
        ))}
      </svg>

      {/* Sticky note overlays */}
      {noteAnnotations.map((ann) => (
        <StickyNote
          key={ann.id}
          annotation={ann}
          pageIndex={pageIndex}
          viewport={viewport}
        />
      ))}

      {/* Signature overlays rendered as DOM elements for drag/resize */}
      {signatureAnnotations.map((ann) => (
        <SignaturePlacement
          key={ann.id}
          annotation={ann}
          pageIndex={pageIndex}
          viewport={viewport}
        />
      ))}
    </div>
  );
};
