import { create } from "zustand";
import { devtools } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SidebarTab = "bookmarks" | "thumbnails" | "none";
export type ScrollMode = "continuous" | "single";
export type ZoomMode = "custom" | "fitWidth" | "fitPage";

export interface SearchResult {
  pageNumber: number;
  matchCount: number;
  rects: DOMRect[];
}

export interface BookmarkItem {
  title: string;
  pageNumber: number;
  dest: unknown;
  children: BookmarkItem[];
}

// ─── State ────────────────────────────────────────────────────────────────────

interface ViewerState {
  // File
  filePath: string | null;
  fileBuffer: ArrayBuffer | null;
  fileName: string | null;

  // Document
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  /** Load-time error (e.g. corrupt file, password-protected) */
  loadError: string | null;

  // Navigation
  currentPage: number;

  // Zoom
  zoom: number; // 0.1 – 5.0 (10% – 500%)
  zoomMode: ZoomMode;

  // Scroll
  scrollMode: ScrollMode;

  // Sidebar
  sidebarTab: SidebarTab;
  bookmarks: BookmarkItem[];

  // Search
  searchQuery: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  isSearchOpen: boolean;
  isIndexing: boolean;

  // UI
  isDarkMode: boolean;
  isFullscreen: boolean;

  // Page manipulation
  pageOrder: number[];

  // Dialog state
  isMergeDialogOpen: boolean;
  isSplitDialogOpen: boolean;
  isPageManagerOpen: boolean;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

interface ViewerActions {
  // File
  openFile: (buffer: ArrayBuffer, path: string, name: string) => void;
  closeFile: () => void;
  setError: (error: string | null) => void;
  setLoadError: (msg: string | null) => void;

  // Document
  setTotalPages: (total: number) => void;
  setLoading: (loading: boolean) => void;

  // Navigation
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirst: () => void;
  goToLast: () => void;

  // Zoom
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoomMode: (mode: ZoomMode) => void;
  resetZoom: () => void;

  // Scroll mode
  setScrollMode: (mode: ScrollMode) => void;

  // Sidebar
  setSidebarTab: (tab: SidebarTab) => void;
  setBookmarks: (bookmarks: BookmarkItem[]) => void;
  toggleSidebar: () => void;

  // Search
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  nextSearchResult: () => void;
  prevSearchResult: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  setIndexing: (indexing: boolean) => void;

  // UI
  toggleDarkMode: () => void;
  setFullscreen: (full: boolean) => void;

  // Page manipulation
  setPageOrder: (order: number[]) => void;

  // Dialogs
  setMergeDialogOpen: (open: boolean) => void;
  setSplitDialogOpen: (open: boolean) => void;
  setPageManagerOpen: (open: boolean) => void;
}

// ─── Zoom step helpers ────────────────────────────────────────────────────────

const ZOOM_STEPS = [
  0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0, 5.0,
];

function snapZoomUp(current: number): number {
  const next = ZOOM_STEPS.find((z) => z > current + 0.001);
  return next ?? 5.0;
}

function snapZoomDown(current: number): number {
  const prev = [...ZOOM_STEPS].reverse().find((z) => z < current - 0.001);
  return prev ?? 0.1;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useViewerStore = create<ViewerState & ViewerActions>()(
  devtools(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────────
      filePath: null,
      fileBuffer: null,
      fileName: null,
      totalPages: 0,
      isLoading: false,
      error: null,
      loadError: null,
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
      isDarkMode: typeof localStorage !== "undefined" ? localStorage.getItem("sv-dark") !== "false" : true,
      isFullscreen: false,
      pageOrder: [],
      isMergeDialogOpen: false,
      isSplitDialogOpen: false,
      isPageManagerOpen: false,

      // ── File actions ───────────────────────────────────────────────────────
      openFile: (buffer, path, name) =>
        set(
          {
            fileBuffer: buffer,
            filePath: path,
            fileName: name,
            currentPage: 1,
            zoom: 1.0,
            zoomMode: "fitWidth",
            sidebarTab: "bookmarks",
            searchQuery: "",
            searchResults: [],
            currentSearchIndex: 0,
            bookmarks: [],
            error: null,
            loadError: null,
            isLoading: true,
          },
          false,
          "openFile"
        ),

      closeFile: () =>
        set(
          {
            filePath: null,
            fileBuffer: null,
            fileName: null,
            totalPages: 0,
            currentPage: 1,
            zoom: 1.0,
            zoomMode: "custom",
            sidebarTab: "none",
            bookmarks: [],
            searchQuery: "",
            searchResults: [],
            currentSearchIndex: 0,
            isSearchOpen: false,
            error: null,
            loadError: null,
            isLoading: false,
          },
          false,
          "closeFile"
        ),

      setError: (error) => set({ error, isLoading: false }, false, "setError"),

      setLoadError: (msg) => set({ loadError: msg }, false, "setLoadError"),

      // ── Document actions ───────────────────────────────────────────────────
      setTotalPages: (total) =>
        set({ totalPages: total }, false, "setTotalPages"),

      setLoading: (loading) =>
        set({ isLoading: loading }, false, "setLoading"),

      // ── Navigation actions ─────────────────────────────────────────────────
      goToPage: (page) => {
        const { totalPages } = get();
        const clamped = Math.max(1, Math.min(page, totalPages));
        set({ currentPage: clamped }, false, "goToPage");
      },

      nextPage: () => {
        const { currentPage, totalPages } = get();
        if (currentPage < totalPages) {
          set({ currentPage: currentPage + 1 }, false, "nextPage");
        }
      },

      prevPage: () => {
        const { currentPage } = get();
        if (currentPage > 1) {
          set({ currentPage: currentPage - 1 }, false, "prevPage");
        }
      },

      goToFirst: () => set({ currentPage: 1 }, false, "goToFirst"),

      goToLast: () => {
        const { totalPages } = get();
        set({ currentPage: totalPages }, false, "goToLast");
      },

      // ── Zoom actions ───────────────────────────────────────────────────────
      setZoom: (zoom) => {
        const clamped = Math.max(0.1, Math.min(zoom, 5.0));
        set({ zoom: clamped, zoomMode: "custom" }, false, "setZoom");
      },

      zoomIn: () => {
        const { zoom } = get();
        const next = snapZoomUp(zoom);
        set({ zoom: next, zoomMode: "custom" }, false, "zoomIn");
      },

      zoomOut: () => {
        const { zoom } = get();
        const prev = snapZoomDown(zoom);
        set({ zoom: prev, zoomMode: "custom" }, false, "zoomOut");
      },

      setZoomMode: (mode) => set({ zoomMode: mode }, false, "setZoomMode"),

      resetZoom: () =>
        set({ zoom: 1.0, zoomMode: "custom" }, false, "resetZoom"),

      // ── Scroll mode ────────────────────────────────────────────────────────
      setScrollMode: (mode) =>
        set({ scrollMode: mode }, false, "setScrollMode"),

      // ── Sidebar actions ────────────────────────────────────────────────────
      setSidebarTab: (tab) =>
        set({ sidebarTab: tab }, false, "setSidebarTab"),

      setBookmarks: (bookmarks) =>
        set({ bookmarks }, false, "setBookmarks"),

      toggleSidebar: () => {
        const { sidebarTab } = get();
        const next: SidebarTab = sidebarTab === "none" ? "bookmarks" : "none";
        set({ sidebarTab: next }, false, "toggleSidebar");
      },

      // ── Search actions ─────────────────────────────────────────────────────
      setSearchQuery: (query) =>
        set({ searchQuery: query, currentSearchIndex: 0 }, false, "setSearchQuery"),

      setSearchResults: (results) =>
        set({ searchResults: results, currentSearchIndex: 0 }, false, "setSearchResults"),

      nextSearchResult: () => {
        const { currentSearchIndex, searchResults } = get();
        const total = searchResults.reduce((s, r) => s + r.matchCount, 0);
        if (total === 0) return;
        const next = (currentSearchIndex + 1) % total;
        set({ currentSearchIndex: next }, false, "nextSearchResult");
      },

      prevSearchResult: () => {
        const { currentSearchIndex, searchResults } = get();
        const total = searchResults.reduce((s, r) => s + r.matchCount, 0);
        if (total === 0) return;
        const prev = (currentSearchIndex - 1 + total) % total;
        set({ currentSearchIndex: prev }, false, "prevSearchResult");
      },

      openSearch: () =>
        set({ isSearchOpen: true }, false, "openSearch"),

      closeSearch: () =>
        set(
          { isSearchOpen: false, searchQuery: "", searchResults: [] },
          false,
          "closeSearch"
        ),

      setIndexing: (indexing) =>
        set({ isIndexing: indexing }, false, "setIndexing"),

      // ── UI actions ─────────────────────────────────────────────────────────
      toggleDarkMode: () => {
        const { isDarkMode } = get();
        const next = !isDarkMode;
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("sv-dark", String(next));
        set({ isDarkMode: next }, false, "toggleDarkMode");
      },

      setFullscreen: (full) =>
        set({ isFullscreen: full }, false, "setFullscreen"),

      setPageOrder: (order) =>
        set({ pageOrder: order }, false, "setPageOrder"),

      setMergeDialogOpen: (open) =>
        set({ isMergeDialogOpen: open }, false, "setMergeDialogOpen"),

      setSplitDialogOpen: (open) =>
        set({ isSplitDialogOpen: open }, false, "setSplitDialogOpen"),

      setPageManagerOpen: (open) =>
        set({ isPageManagerOpen: open }, false, "setPageManagerOpen"),
    }),
    { name: "SharkView Viewer Store" }
  )
);
