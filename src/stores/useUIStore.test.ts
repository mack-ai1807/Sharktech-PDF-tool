import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "@/stores/useUIStore";

// Reset store between tests
beforeEach(() => {
  useUIStore.setState({
    sidebarMode: null,
    toolbarMode: "select",
    highlightColor: "#FFD700",
    error: null,
  });
});

describe("useUIStore", () => {
  describe("sidebarMode", () => {
    it("setSidebarMode updates sidebarMode", () => {
      useUIStore.getState().setSidebarMode("bookmarks");
      expect(useUIStore.getState().sidebarMode).toBe("bookmarks");
    });

    it("setSidebarMode to null closes the sidebar", () => {
      useUIStore.getState().setSidebarMode("thumbnails");
      useUIStore.getState().setSidebarMode(null);
      expect(useUIStore.getState().sidebarMode).toBeNull();
    });

    it("toggleSidebarMode opens when null", () => {
      useUIStore.getState().toggleSidebarMode("bookmarks");
      expect(useUIStore.getState().sidebarMode).toBe("bookmarks");
    });

    it("toggleSidebarMode closes when already active", () => {
      useUIStore.getState().setSidebarMode("bookmarks");
      useUIStore.getState().toggleSidebarMode("bookmarks");
      expect(useUIStore.getState().sidebarMode).toBeNull();
    });

    it("toggleSidebarMode switches to different tab", () => {
      useUIStore.getState().setSidebarMode("bookmarks");
      useUIStore.getState().toggleSidebarMode("thumbnails");
      expect(useUIStore.getState().sidebarMode).toBe("thumbnails");
    });
  });

  describe("toolbarMode", () => {
    it("defaults to 'select'", () => {
      expect(useUIStore.getState().toolbarMode).toBe("select");
    });

    it("setToolbarMode updates correctly", () => {
      useUIStore.getState().setToolbarMode("highlight");
      expect(useUIStore.getState().toolbarMode).toBe("highlight");
    });

    it("setToolbarMode can switch between all modes", () => {
      const modes = ["highlight", "underline", "strikethrough", "note", "signature", "select"] as const;
      for (const mode of modes) {
        useUIStore.getState().setToolbarMode(mode);
        expect(useUIStore.getState().toolbarMode).toBe(mode);
      }
    });
  });

  describe("error handling", () => {
    it("setError stores error string", () => {
      useUIStore.getState().setError("File appears to be damaged");
      expect(useUIStore.getState().error).toBe("File appears to be damaged");
    });

    it("setError with null clears error", () => {
      useUIStore.getState().setError("Some error");
      useUIStore.getState().setError(null);
      expect(useUIStore.getState().error).toBeNull();
    });

    it("clearError resets error to null", () => {
      useUIStore.getState().setError("Some error");
      useUIStore.getState().clearError();
      expect(useUIStore.getState().error).toBeNull();
    });
  });

  describe("highlightColor", () => {
    it("defaults to yellow (#FFD700)", () => {
      expect(useUIStore.getState().highlightColor).toBe("#FFD700");
    });

    it("setHighlightColor updates color", () => {
      useUIStore.getState().setHighlightColor("#86EFAC");
      expect(useUIStore.getState().highlightColor).toBe("#86EFAC");
    });
  });
});
