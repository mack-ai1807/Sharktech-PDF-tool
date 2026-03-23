/**
 * useAnnotationStore.test.ts
 * Unit tests for the annotation store.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useAnnotationStore } from "./useAnnotationStore";
import type { Annotation } from "@/types/annotation";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: "ann-1",
    type: "highlight",
    pageIndex: 0,
    color: "#FFD700",
    opacity: 0.4,
    pdfRects: [{ x: 10, y: 20, width: 100, height: 15 }],
    createdAt: Date.now(),
    ...overrides,
  };
}

function resetStore() {
  useAnnotationStore.setState({ annotations: {}, selectedId: null, isDirty: false });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useAnnotationStore", () => {
  beforeEach(resetStore);

  describe("addAnnotation", () => {
    it("stores annotation on correct pageIndex", () => {
      const ann = makeAnnotation({ id: "a1", pageIndex: 2 });
      useAnnotationStore.getState().addAnnotation(ann);
      const page2 = useAnnotationStore.getState().annotations[2];
      expect(page2).toHaveLength(1);
      expect(page2[0].id).toBe("a1");
    });

    it("appends multiple annotations on the same page", () => {
      const a1 = makeAnnotation({ id: "a1", pageIndex: 0 });
      const a2 = makeAnnotation({ id: "a2", pageIndex: 0, color: "#86EFAC" });
      useAnnotationStore.getState().addAnnotation(a1);
      useAnnotationStore.getState().addAnnotation(a2);
      const page0 = useAnnotationStore.getState().annotations[0];
      expect(page0).toHaveLength(2);
    });

    it("stores annotations on different pages independently", () => {
      const a1 = makeAnnotation({ id: "a1", pageIndex: 0 });
      const a2 = makeAnnotation({ id: "a2", pageIndex: 5 });
      useAnnotationStore.getState().addAnnotation(a1);
      useAnnotationStore.getState().addAnnotation(a2);
      expect(useAnnotationStore.getState().annotations[0]).toHaveLength(1);
      expect(useAnnotationStore.getState().annotations[5]).toHaveLength(1);
    });
  });

  describe("deleteAnnotation", () => {
    it("removes annotation by id", () => {
      const ann = makeAnnotation({ id: "del-1", pageIndex: 0 });
      useAnnotationStore.getState().addAnnotation(ann);
      expect(useAnnotationStore.getState().annotations[0]).toHaveLength(1);
      useAnnotationStore.getState().deleteAnnotation("del-1", 0);
      expect(useAnnotationStore.getState().annotations[0]).toHaveLength(0);
    });

    it("does not affect other annotations on same page", () => {
      const a1 = makeAnnotation({ id: "keep", pageIndex: 0 });
      const a2 = makeAnnotation({ id: "remove", pageIndex: 0 });
      useAnnotationStore.getState().addAnnotation(a1);
      useAnnotationStore.getState().addAnnotation(a2);
      useAnnotationStore.getState().deleteAnnotation("remove", 0);
      const page0 = useAnnotationStore.getState().annotations[0];
      expect(page0).toHaveLength(1);
      expect(page0[0].id).toBe("keep");
    });

    it("clears selectedId if deleted annotation was selected", () => {
      const ann = makeAnnotation({ id: "sel", pageIndex: 0 });
      useAnnotationStore.getState().addAnnotation(ann);
      useAnnotationStore.getState().selectAnnotation("sel");
      expect(useAnnotationStore.getState().selectedId).toBe("sel");
      useAnnotationStore.getState().deleteAnnotation("sel", 0);
      expect(useAnnotationStore.getState().selectedId).toBeNull();
    });
  });

  describe("selectAnnotation", () => {
    it("sets selectedId", () => {
      useAnnotationStore.getState().selectAnnotation("ann-42");
      expect(useAnnotationStore.getState().selectedId).toBe("ann-42");
    });

    it("clears selectedId with null", () => {
      useAnnotationStore.getState().selectAnnotation("ann-42");
      useAnnotationStore.getState().selectAnnotation(null);
      expect(useAnnotationStore.getState().selectedId).toBeNull();
    });
  });

  describe("clearPage", () => {
    it("removes all annotations for the given page", () => {
      useAnnotationStore.getState().addAnnotation(makeAnnotation({ id: "a1", pageIndex: 3 }));
      useAnnotationStore.getState().addAnnotation(makeAnnotation({ id: "a2", pageIndex: 3 }));
      useAnnotationStore.getState().addAnnotation(makeAnnotation({ id: "a3", pageIndex: 4 }));
      useAnnotationStore.getState().clearPage(3);
      expect(useAnnotationStore.getState().annotations[3]).toBeUndefined();
      expect(useAnnotationStore.getState().annotations[4]).toHaveLength(1);
    });
  });

  describe("isDirty / markSaved", () => {
    it("isDirty starts as false", () => {
      expect(useAnnotationStore.getState().isDirty).toBe(false);
    });

    it("addAnnotation sets isDirty to true", () => {
      useAnnotationStore.getState().addAnnotation(makeAnnotation({ id: "dirty-1" }));
      expect(useAnnotationStore.getState().isDirty).toBe(true);
    });

    it("deleteAnnotation sets isDirty to true", () => {
      useAnnotationStore.getState().addAnnotation(makeAnnotation({ id: "dirty-2" }));
      useAnnotationStore.getState().markSaved(); // reset
      useAnnotationStore.getState().deleteAnnotation("dirty-2", 0);
      expect(useAnnotationStore.getState().isDirty).toBe(true);
    });

    it("updateAnnotation sets isDirty to true", () => {
      useAnnotationStore.getState().addAnnotation(makeAnnotation({ id: "dirty-3" }));
      useAnnotationStore.getState().markSaved();
      useAnnotationStore.getState().updateAnnotation("dirty-3", 0, { color: "#FF0000" });
      expect(useAnnotationStore.getState().isDirty).toBe(true);
    });

    it("markSaved resets isDirty to false", () => {
      useAnnotationStore.getState().addAnnotation(makeAnnotation({ id: "saved-1" }));
      expect(useAnnotationStore.getState().isDirty).toBe(true);
      useAnnotationStore.getState().markSaved();
      expect(useAnnotationStore.getState().isDirty).toBe(false);
    });

    it("clearAll resets isDirty to false", () => {
      useAnnotationStore.getState().addAnnotation(makeAnnotation({ id: "all-1" }));
      expect(useAnnotationStore.getState().isDirty).toBe(true);
      useAnnotationStore.getState().clearAll();
      expect(useAnnotationStore.getState().isDirty).toBe(false);
    });
  });
});
