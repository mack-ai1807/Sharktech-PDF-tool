import { create } from "zustand";
import { devtools } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SidebarMode = "bookmarks" | "thumbnails" | "search" | null;

export type ToolbarMode =
  | "select"
  | "highlight"
  | "underline"
  | "strikethrough"
  | "note"
  | "signature";

// ─── State ────────────────────────────────────────────────────────────────────

interface UIState {
  /** Active sidebar panel; null = sidebar closed */
  sidebarMode: SidebarMode;
  /** Active annotation/interaction tool */
  toolbarMode: ToolbarMode;
  /** Currently selected highlight colour (hex) */
  highlightColor: string;
  /** App-level error message; null = no error */
  error: string | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

interface UIActions {
  setSidebarMode: (mode: SidebarMode) => void;
  toggleSidebarMode: (mode: SidebarMode) => void;
  setToolbarMode: (mode: ToolbarMode) => void;
  setHighlightColor: (color: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useUIStore = create<UIState & UIActions>()(
  devtools(
    (set, get) => ({
      // ── Initial state ────────────────────────────────────────────────────
      sidebarMode: null,
      toolbarMode: "select",
      highlightColor: "#FFD700",
      error: null,

      // ── Actions ──────────────────────────────────────────────────────────
      setSidebarMode: (mode) =>
        set({ sidebarMode: mode }, false, "setSidebarMode"),

      /** Toggle: if already active tab → close; else open that tab */
      toggleSidebarMode: (mode) => {
        const current = get().sidebarMode;
        set(
          { sidebarMode: current === mode ? null : mode },
          false,
          "toggleSidebarMode"
        );
      },

      setToolbarMode: (mode) =>
        set({ toolbarMode: mode }, false, "setToolbarMode"),

      setHighlightColor: (color) =>
        set({ highlightColor: color }, false, "setHighlightColor"),

      setError: (error) => set({ error }, false, "setError"),

      clearError: () => set({ error: null }, false, "clearError"),
    }),
    { name: "SharkView UI Store" }
  )
);
