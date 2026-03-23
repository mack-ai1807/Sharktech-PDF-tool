/**
 * useViewerStore — canonical re-export for architecture-compliant imports.
 *
 * The comprehensive implementation lives in `viewerStore.ts` (legacy name).
 * All new code MUST import from this file, never from `viewerStore.ts` directly.
 *
 * When Story 1.2 (PDF rendering) is implemented, document state will be
 * migrated fully here. For Story 1.1, we expose the existing store with
 * the correct module alias so the rest of the architecture can depend on it.
 */
export {
  useViewerStore,
  type SidebarTab,
  type ScrollMode,
  type ZoomMode,
  type SearchResult,
  type BookmarkItem,
} from "@/stores/viewerStore";

