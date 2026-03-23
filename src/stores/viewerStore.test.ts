/**
 * viewerStore.test.ts — Vitest unit tests
 * Target: 85%+ coverage of all Zustand store actions
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useViewerStore } from "./viewerStore";

// Reset store before each test
function resetStore() {
  useViewerStore.setState({
    filePath: null,
    fileBuffer: null,
    fileName: null,
    totalPages: 0,
    isLoading: false,
    error: null,
    currentPage: 1,
    zoom: 1.0,
    zoomMode: "custom",
    scrollMode: "continuous",
    sidebarTab: "none",
    bookmarks: [],
    searchQuery: "",
    searchResults: [],
    currentSearchIndex: 0,
    isSearchOpen: false,
    isIndexing: false,
    isDarkMode: true,
    isFullscreen: false,
  });
}

// ── File actions ──────────────────────────────────────────────────────────────

describe("file actions", () => {
  beforeEach(resetStore);

  it("openFile sets buffer, path, name and resets nav state", () => {
    const buf = new ArrayBuffer(8);
    useViewerStore.getState().openFile(buf, "/tmp/test.pdf", "test.pdf");
    const state = useViewerStore.getState();
    expect(state.fileBuffer).toBe(buf);
    expect(state.filePath).toBe("/tmp/test.pdf");
    expect(state.fileName).toBe("test.pdf");
    expect(state.currentPage).toBe(1);
    expect(state.zoom).toBe(1.0);
    expect(state.zoomMode).toBe("fitWidth");
    expect(state.sidebarTab).toBe("bookmarks");
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  it("closeFile resets all state to empty", () => {
    const buf = new ArrayBuffer(8);
    useViewerStore.getState().openFile(buf, "/tmp/test.pdf", "test.pdf");
    useViewerStore.getState().closeFile();
    const state = useViewerStore.getState();
    expect(state.fileBuffer).toBeNull();
    expect(state.filePath).toBeNull();
    expect(state.fileName).toBeNull();
    expect(state.totalPages).toBe(0);
    expect(state.sidebarTab).toBe("none");
    expect(state.isLoading).toBe(false);
  });

  it("setError clears loading flag", () => {
    useViewerStore.getState().setLoading(true);
    useViewerStore.getState().setError("Something went wrong");
    const state = useViewerStore.getState();
    expect(state.error).toBe("Something went wrong");
    expect(state.isLoading).toBe(false);
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe("navigation actions", () => {
  beforeEach(() => {
    resetStore();
    useViewerStore.setState({ totalPages: 10 });
  });

  it("goToPage clamps to [1, totalPages]", () => {
    useViewerStore.getState().goToPage(5);
    expect(useViewerStore.getState().currentPage).toBe(5);

    useViewerStore.getState().goToPage(0);
    expect(useViewerStore.getState().currentPage).toBe(1);

    useViewerStore.getState().goToPage(999);
    expect(useViewerStore.getState().currentPage).toBe(10);
  });

  it("nextPage increments within bounds", () => {
    useViewerStore.setState({ currentPage: 5 });
    useViewerStore.getState().nextPage();
    expect(useViewerStore.getState().currentPage).toBe(6);
  });

  it("nextPage does not exceed totalPages", () => {
    useViewerStore.setState({ currentPage: 10 });
    useViewerStore.getState().nextPage();
    expect(useViewerStore.getState().currentPage).toBe(10);
  });

  it("prevPage decrements within bounds", () => {
    useViewerStore.setState({ currentPage: 5 });
    useViewerStore.getState().prevPage();
    expect(useViewerStore.getState().currentPage).toBe(4);
  });

  it("prevPage does not go below 1", () => {
    useViewerStore.setState({ currentPage: 1 });
    useViewerStore.getState().prevPage();
    expect(useViewerStore.getState().currentPage).toBe(1);
  });

  it("goToFirst sets page to 1", () => {
    useViewerStore.setState({ currentPage: 8 });
    useViewerStore.getState().goToFirst();
    expect(useViewerStore.getState().currentPage).toBe(1);
  });

  it("goToLast sets page to totalPages", () => {
    useViewerStore.getState().goToLast();
    expect(useViewerStore.getState().currentPage).toBe(10);
  });
});

// ── Zoom ──────────────────────────────────────────────────────────────────────

describe("zoom actions", () => {
  beforeEach(resetStore);

  it("setZoom clamps to [0.1, 5.0]", () => {
    useViewerStore.getState().setZoom(2.5);
    expect(useViewerStore.getState().zoom).toBe(2.5);
    expect(useViewerStore.getState().zoomMode).toBe("custom");

    useViewerStore.getState().setZoom(-1);
    expect(useViewerStore.getState().zoom).toBe(0.1);

    useViewerStore.getState().setZoom(99);
    expect(useViewerStore.getState().zoom).toBe(5.0);
  });

  it("zoomIn steps to next preset level", () => {
    useViewerStore.setState({ zoom: 1.0 });
    useViewerStore.getState().zoomIn();
    expect(useViewerStore.getState().zoom).toBe(1.25);
  });

  it("zoomOut steps to previous preset level", () => {
    useViewerStore.setState({ zoom: 1.0 });
    useViewerStore.getState().zoomOut();
    expect(useViewerStore.getState().zoom).toBe(0.75);
  });

  it("zoomIn does not exceed 5.0", () => {
    useViewerStore.setState({ zoom: 5.0 });
    useViewerStore.getState().zoomIn();
    expect(useViewerStore.getState().zoom).toBe(5.0);
  });

  it("zoomOut does not go below 0.1", () => {
    useViewerStore.setState({ zoom: 0.1 });
    useViewerStore.getState().zoomOut();
    expect(useViewerStore.getState().zoom).toBe(0.1);
  });

  it("resetZoom returns to 1.0 custom", () => {
    useViewerStore.setState({ zoom: 3.0 });
    useViewerStore.getState().resetZoom();
    expect(useViewerStore.getState().zoom).toBe(1.0);
    expect(useViewerStore.getState().zoomMode).toBe("custom");
  });

  it("setZoomMode updates mode", () => {
    useViewerStore.getState().setZoomMode("fitWidth");
    expect(useViewerStore.getState().zoomMode).toBe("fitWidth");
    useViewerStore.getState().setZoomMode("fitPage");
    expect(useViewerStore.getState().zoomMode).toBe("fitPage");
  });
});

// ── Sidebar ───────────────────────────────────────────────────────────────────

describe("sidebar actions", () => {
  beforeEach(resetStore);

  it("setSidebarTab updates tab", () => {
    useViewerStore.getState().setSidebarTab("thumbnails");
    expect(useViewerStore.getState().sidebarTab).toBe("thumbnails");
  });

  it("toggleSidebar opens when closed", () => {
    useViewerStore.setState({ sidebarTab: "none" });
    useViewerStore.getState().toggleSidebar();
    expect(useViewerStore.getState().sidebarTab).toBe("bookmarks");
  });

  it("toggleSidebar closes when open", () => {
    useViewerStore.setState({ sidebarTab: "bookmarks" });
    useViewerStore.getState().toggleSidebar();
    expect(useViewerStore.getState().sidebarTab).toBe("none");
  });

  it("setBookmarks stores bookmark tree", () => {
    const bm = [{ title: "Chapter 1", pageNumber: 1, dest: null, children: [] }];
    useViewerStore.getState().setBookmarks(bm);
    expect(useViewerStore.getState().bookmarks).toEqual(bm);
  });
});

// ── Search ────────────────────────────────────────────────────────────────────

describe("search actions", () => {
  beforeEach(resetStore);

  it("setSearchQuery resets currentSearchIndex", () => {
    useViewerStore.setState({ currentSearchIndex: 5 });
    useViewerStore.getState().setSearchQuery("contract");
    expect(useViewerStore.getState().searchQuery).toBe("contract");
    expect(useViewerStore.getState().currentSearchIndex).toBe(0);
  });

  it("nextSearchResult wraps around", () => {
    useViewerStore.setState({
      searchResults: [{ pageNumber: 1, matchCount: 2, rects: [] }],
      currentSearchIndex: 1,
    });
    useViewerStore.getState().nextSearchResult();
    expect(useViewerStore.getState().currentSearchIndex).toBe(0);
  });

  it("prevSearchResult wraps backward", () => {
    useViewerStore.setState({
      searchResults: [{ pageNumber: 1, matchCount: 3, rects: [] }],
      currentSearchIndex: 0,
    });
    useViewerStore.getState().prevSearchResult();
    expect(useViewerStore.getState().currentSearchIndex).toBe(2);
  });

  it("openSearch sets isSearchOpen", () => {
    useViewerStore.getState().openSearch();
    expect(useViewerStore.getState().isSearchOpen).toBe(true);
  });

  it("closeSearch clears query and results", () => {
    useViewerStore.setState({
      isSearchOpen: true,
      searchQuery: "test",
      searchResults: [{ pageNumber: 1, matchCount: 1, rects: [] }],
    });
    useViewerStore.getState().closeSearch();
    const state = useViewerStore.getState();
    expect(state.isSearchOpen).toBe(false);
    expect(state.searchQuery).toBe("");
    expect(state.searchResults).toHaveLength(0);
  });
});

// ── Scroll mode ───────────────────────────────────────────────────────────────

describe("scroll mode", () => {
  beforeEach(resetStore);

  it("setScrollMode sets the scroll mode", () => {
    useViewerStore.getState().setScrollMode("single");
    expect(useViewerStore.getState().scrollMode).toBe("single");
    useViewerStore.getState().setScrollMode("continuous");
    expect(useViewerStore.getState().scrollMode).toBe("continuous");
  });
});

// ── UI ────────────────────────────────────────────────────────────────────────

describe("UI actions", () => {
  beforeEach(resetStore);

  it("setFullscreen updates state", () => {
    useViewerStore.getState().setFullscreen(true);
    expect(useViewerStore.getState().isFullscreen).toBe(true);
  });

  it("setLoading updates isLoading", () => {
    useViewerStore.getState().setLoading(true);
    expect(useViewerStore.getState().isLoading).toBe(true);
    useViewerStore.getState().setLoading(false);
    expect(useViewerStore.getState().isLoading).toBe(false);
  });
});
