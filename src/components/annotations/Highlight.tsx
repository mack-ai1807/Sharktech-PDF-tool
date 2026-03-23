/**
 * Highlight.tsx
 * Renders a single highlight annotation as SVG rects over the PDF canvas.
 * Pointer events enabled on rects for right-click context menu.
 */

import React from "react";
import type { PageViewport } from "pdfjs-dist";
import type { Annotation } from "@/types/annotation";
import { pdfToScreenRect } from "@/lib/pdf-coordinates";
import { useAnnotationStore } from "@/stores/useAnnotationStore";
import { toast } from "@/stores/useToastStore";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface HighlightProps {
  annotation: Annotation;
  viewport: PageViewport;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Highlight: React.FC<HighlightProps> = ({ annotation, viewport }) => {
  const selectedId = useAnnotationStore((s) => s.selectedId);
  const deleteAnnotation = useAnnotationStore((s) => s.deleteAnnotation);

  const isSelected = selectedId === annotation.id;

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    deleteAnnotation(annotation.id, annotation.pageIndex);
    toast.info("Annotation removed");
  }

  return (
    <>
      {annotation.pdfRects.map((pdfRect, i) => {
        const screenRect = pdfToScreenRect(pdfRect, viewport);
        return (
          <rect
            key={i}
            x={screenRect.x}
            y={screenRect.y}
            width={screenRect.width}
            height={screenRect.height}
            fill={annotation.color}
            fillOpacity={isSelected ? annotation.opacity * 1.5 : annotation.opacity}
            stroke={isSelected ? annotation.color : "none"}
            strokeWidth={isSelected ? 1.5 : 0}
            strokeOpacity={0.8}
            rx={1}
            style={{ pointerEvents: "auto", cursor: "context-menu" }}
            onContextMenu={handleContextMenu}
            role="button"
            aria-label={`${annotation.type} annotation`}
          />
        );
      })}
    </>
  );
};
