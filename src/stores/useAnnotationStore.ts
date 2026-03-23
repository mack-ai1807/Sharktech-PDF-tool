/**
 * useAnnotationStore.ts
 * Zustand state slice for PDF annotations.
 * Annotations are keyed by pageIndex for O(1) per-page lookup.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Annotation } from "@/types/annotation";

// ── State ─────────────────────────────────────────────────────────────────────

interface AnnotationState {
  /** pageIndex → array of annotations */
  annotations: Record<number, Annotation[]>;
  /** Currently focused annotation id, null = none */
  selectedId: string | null;
  /** True when annotations have changed since last save */
  isDirty: boolean;
}

// ── Actions ───────────────────────────────────────────────────────────────────

interface AnnotationActions {
  addAnnotation: (ann: Annotation) => void;
  updateAnnotation: (id: string, pageIndex: number, patch: Partial<Annotation>) => void;
  deleteAnnotation: (id: string, pageIndex: number) => void;
  selectAnnotation: (id: string | null) => void;
  clearPage: (pageIndex: number) => void;
  clearAll: () => void;
  /** Mark annotations as saved — resets isDirty to false */
  markSaved: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAnnotationStore = create<AnnotationState & AnnotationActions>()(
  devtools(
    (set, get) => ({
      // ── Initial state ─────────────────────────────────────────────────────
      annotations: {},
      selectedId: null,
      isDirty: false,

      // ── Actions ───────────────────────────────────────────────────────────
      addAnnotation: (ann) => {
        const { annotations } = get();
        const existing = annotations[ann.pageIndex] ?? [];
        set(
          {
            annotations: {
              ...annotations,
              [ann.pageIndex]: [...existing, ann],
            },
            isDirty: true,
          },
          false,
          "addAnnotation"
        );
      },

      updateAnnotation: (id, pageIndex, patch) => {
        const { annotations } = get();
        const page = annotations[pageIndex] ?? [];
        set(
          {
            annotations: {
              ...annotations,
              [pageIndex]: page.map((a) =>
                a.id === id ? { ...a, ...patch } : a
              ),
            },
            isDirty: true,
          },
          false,
          "updateAnnotation"
        );
      },

      deleteAnnotation: (id, pageIndex) => {
        const { annotations } = get();
        const page = annotations[pageIndex] ?? [];
        set(
          {
            annotations: {
              ...annotations,
              [pageIndex]: page.filter((a) => a.id !== id),
            },
            selectedId: get().selectedId === id ? null : get().selectedId,
            isDirty: true,
          },
          false,
          "deleteAnnotation"
        );
      },

      selectAnnotation: (id) =>
        set({ selectedId: id }, false, "selectAnnotation"),

      clearPage: (pageIndex) => {
        const { annotations } = get();
        const next = { ...annotations };
        delete next[pageIndex];
        set({ annotations: next }, false, "clearPage");
      },

      clearAll: () =>
        set({ annotations: {}, selectedId: null, isDirty: false }, false, "clearAll"),

      markSaved: () =>
        set({ isDirty: false }, false, "markSaved"),
    }),
    { name: "SharkView Annotation Store" }
  )
);
