# SharkView v0.1 — Full Codebase Audit
**Date:** 2026-03-23
**Auditor:** Senior Full-Stack / UI specialist

---

## ✅ RESOLVED — Phase 2 Fix Session (2026-03-23)

| ID | Issue | Status | Fix Applied |
|---|---|---|---|
| BUG-1 | Ctrl+F search non-functional | ✅ FIXED | `src/components/SearchPanel.tsx` fully rewritten to use `useSearchStore` + `buildSearchIndex` — real PDF text search now wired to overlay |
| BUG-2 | `animate-fade-in` class undefined | ✅ FIXED | `@keyframes fadeIn` + `.animate-fade-in` added to `src/index.css` |
| BUG-3 | Search hits don't scroll to page | ✅ FIXED | `useSearchStore.nextHit/prevHit` now calls `useViewerStore.getState().goToPage(hit.pageIndex + 1)` |
| BUG-4 | Dead duplicate component files | ✅ FIXED | Deleted `src/components/Toolbar.tsx` and `src/components/Sidebar.tsx` |
| BUG-5 | Dead `sharkview:open-file` event listener | ✅ FIXED | Removed `useEffect` from `App.tsx`; open file now calls `openNativeDialog()` directly |
| BUG-6 | `window.confirm()` for annotation delete | ✅ FIXED | Replaced with immediate delete + `toast.info("Annotation removed")` in `Highlight.tsx`, `StickyNote.tsx`, `AnnotationLayer.tsx` |
| HIGH-1 | Dark mode not persisted | ✅ FIXED | `viewerStore.ts` now reads/writes `localStorage.getItem("sv-dark")` on init and toggle |
| MED-2 | No global toast notification system | ✅ FIXED | `src/stores/useToastStore.ts` + `src/components/ui/ToastContainer.tsx` — auto-dismiss 3500ms, type-based icons |
| MED-3 | Sidebar thumbnail doesn't auto-scroll | ✅ FIXED | `ThumbnailItem` in `Sidebar.tsx` has `useEffect` calling `scrollIntoView({ behavior: "smooth", block: "nearest" })` on `isCurrent` change |
| UI-4 | No `.env.example` file | ✅ FIXED | `.env.example` created documenting Tauri signing key env vars |
| SERVER-1 | Vite cold-start slow | ✅ MITIGATED | `vite.config.ts` `optimizeDeps.include` expanded with all heavy deps |

---

## 🔴 CRITICAL BUGS

### BUG-1: ~~Ctrl+F search bar is completely non-functional~~ ✅ RESOLVED
**Fix applied 2026-03-23:** `src/components/SearchPanel.tsx` fully rewritten. Now uses `useSearchStore` + `buildSearchIndex` from `src/lib/pdf-search.ts`. Builds real PDF text index when `pdfDoc` changes. Case-sensitive toggle, live indexing progress, result count display, prev/next navigation wired to `goToPage`.

### BUG-2: ~~`animate-fade-in` class not defined~~ ✅ RESOLVED
**Fix applied 2026-03-23:** Added to `src/index.css` — `@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; } }` + `.animate-fade-in { animation: fadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) both; }`

### BUG-3: ~~Search hits don't scroll to page~~ ✅ RESOLVED
**Fix applied 2026-03-23:** `src/stores/useSearchStore.ts` — both `nextHit` and `prevHit` now call `useViewerStore.getState().goToPage(hits[next].pageIndex + 1)` after updating `activeHitIndex`.

### BUG-4: ~~Duplicate/dead component files~~ ✅ RESOLVED
**Fix applied 2026-03-23:** Deleted `src/components/Toolbar.tsx` and `src/components/Sidebar.tsx`.

### BUG-5: ~~Dead event listener in App.tsx~~ ✅ RESOLVED
**Fix applied 2026-03-23:** Removed `useEffect` that listened to `sharkview:open-file` in `src/App.tsx`.

### BUG-6: ~~`window.confirm()` for annotation delete~~ ✅ RESOLVED
**Fix applied 2026-03-23:** All three call sites replaced with immediate delete + `toast.info()`. No more blocking UI dialogs.

---

## 🟠 HIGH SEVERITY

### HIGH-1: ~~Dark mode not persisted~~ ✅ RESOLVED
**Fix applied 2026-03-23:** `viewerStore.ts` initializes `isDarkMode` from `localStorage.getItem("sv-dark")` and writes on every toggle.

### HIGH-2: Annotations not visible in other PDF readers
**File:** `src/lib/pdf-export.ts`
**Root cause:** Annotations are saved using a custom `%SharkViewAnnotations` trailer block injected into the PDF file. This is a proprietary format — Adobe Acrobat, macOS Preview, and other readers ignore it. Only SharkView can read its own annotations.
**Fix (v1.1):** Migrate to `pdf-lib` annotation objects (real PDF `/Annot` dictionaries). Currently flagged as known limitation, documented in audit.

### HIGH-3: Signatures are overlay-only, not burned into PDF
**File:** `src/components/signatures/SignaturePlacement.tsx`
**Root cause:** Signatures are rendered as DOM elements on top of the PDF. They don't get written into the actual PDF bytes (no flatten). The signature image needs to be embedded as a pdf-lib XObject.
**Fix (v1.1):** Implement signature flatten in `pdf-export.ts` using pdf-lib image embedding.

### HIGH-4: Page Manager has no UI entry point
**File:** `src/stores/viewerStore.ts` — `setPageManagerOpen` action exists but toolbar has no button for it.
**Fix:** Add a "Reorder Pages" button in the toolbar, wired to `setPageManagerOpen(true)`.

---

## 🟡 MEDIUM SEVERITY

### MED-1: Native `<select>` for zoom level
**File:** `src/components/layout/Toolbar.tsx` — `ZoomControl()` function
**Root cause:** Uses a native `<select>` element that can't be styled to match the dark glass aesthetic. On macOS it renders with a native grey box.
**Fix:** Replace with a custom dropdown (Radix UI `Select` or a simple Tailwind-styled dropdown).

### MED-2: ~~No global toast notification system~~ ✅ RESOLVED
**Fix applied 2026-03-23:** `src/stores/useToastStore.ts` + `src/components/ui/ToastContainer.tsx` created. Auto-dismiss 3500ms. Success/error/info types with icons. Wired into `App.tsx`.

### MED-3: ~~Sidebar thumbnail doesn't auto-scroll~~ ✅ RESOLVED
**Fix applied 2026-03-23:** `ThumbnailItem` now calls `scrollIntoView({ behavior: "smooth", block: "nearest" })` when `isCurrent` changes.

### MED-4: Search highlight overlay (`SearchHighlight.tsx`) never mounted
**File:** `src/components/navigation/SearchHighlight.tsx` exists but is not used in `PdfDocument` or `AnnotationLayer`.
**Root cause:** The component was implemented but never wired into the render tree.
**Fix:** Mount `SearchHighlight` inside `PageWrapper` in `PdfDocument.tsx`, passing the current page's search hits.

### MED-5: Highlight color `#FFD700` clashes with brand gold
**File:** `src/stores/useUIStore.ts` — `highlightColor: "#FFD700"`
**Root cause:** Default highlight color is the same gold as the brand accent color. On light PDFs this is correct, but visually confusing in the dark UI context.
**Fix:** Change default highlight color to a more distinct yellow, e.g. `"#FDE047"`, and offer a wider palette.

---

## 🟢 LOW / UI-UX ISSUES

### UI-1: No loading skeleton on PDF pages
Pages show a plain `animate-pulse` grey box while off-screen. The `.skeleton-shimmer` CSS class was added to `index.css` but not yet applied to page placeholders.

### UI-2: ~~Sticky note delete uses `window.confirm()`~~ ✅ RESOLVED
(Covered by BUG-6 above.)

### UI-3: Zoom `<select>` uses native browser styling (covered in MED-1)

### UI-4: ~~No `.env.example` file~~ ✅ RESOLVED
`.env.example` created 2026-03-23.

### UI-5: `focus:border-shark-500` class in SearchPanel overlay
`shark-500` is not a color defined in the Tailwind config — it silently has no effect. Note: The full SearchPanel overlay was rewritten (BUG-1 fix) so this class no longer appears.

### UI-6: Sidebar search tab shown but never opens sidebar search in v2
The sidebar has a "Search" tab that opens `SearchPanel` (sidebar version). But Ctrl+F opens the overlay version. Two search UIs — confusing. Should be unified.

### UI-7: HelpTooltip keyboard shortcuts list not up to date
Some shortcuts shown may not match actual implementation.

---

## 🖥️ DEV SERVER ISSUES

### SERVER-1: ~~Vite cold-start extremely slow~~ ✅ MITIGATED
`vite.config.ts` `optimizeDeps.include` now declares all heavy deps: `pdfjs-dist`, `pdf-lib`, `react`, `react-dom`, `react/jsx-runtime`, `zustand`, `zustand/middleware`. Vite skips discovery on subsequent runs.
**Workaround:** Use `npm run preview` (port 4173) for fast testing after build.

### SERVER-2: Port 1420 not auto-freed between sessions
**Root cause:** Previous Tauri dev server or Vite instance holds the port. Not a config issue.
**Fix:** Already handled — `lsof -ti :1420 | xargs kill -9` before starting.

### SERVER-3: ~~No `.env.example` file~~ ✅ RESOLVED
`.env.example` created 2026-03-23.

---

## ✅ WHAT'S WORKING (v0.2 — Post Phase 2 Fix Session)
- Open File (Ctrl+O + folder icon) — ✅
- Drag-and-drop PDF open — ✅
- Multi-page PDF rendering via PDF.js — ✅
- Zoom in/out/fit-width/fit-page — ✅
- Page navigation (arrows, keyboard, toolbar) — ✅
- Highlight / Underline / Strikethrough annotations — ✅
- Sticky Notes (add, drag, edit, delete) — ✅ (no more confirm dialog)
- Signature pad (draw + type) — ✅ (overlay-only)
- Sidebar thumbnails + click navigation — ✅ (auto-scrolls to active page)
- Sidebar bookmarks (PDF outline) — ✅
- Sidebar search (text search with index) — ✅
- **Ctrl+F overlay search** — ✅ FIXED (real PDF text index, prev/next, navigates page)
- Save / Save As (browser download + Tauri write) — ✅
- Merge PDFs (browser + Tauri) — ✅
- Split PDF (browser + Tauri) — ✅
- Dark/light mode toggle — ✅ **PERSISTED** (localStorage)
- Error boundary — ✅
- Keyboard shortcuts — ✅
- Auto-update check (Tauri only) — ✅
- Toast notifications — ✅ NEW (success/error/info, auto-dismiss)
- SharkTech Global logo — ✅ NEW (gold metallic shark mark + wordmark)
- `animate-fade-in` CSS animation — ✅ FIXED

---

## REMAINING BACKLOG (v1.1)
| Priority | Issue | Effort |
|---|---|---|
| 🟠 H | HIGH-2: Real PDF annotation objects via pdf-lib | 4h |
| 🟠 H | HIGH-3: Signature flatten/burn-in | 2h |
| 🟠 H | HIGH-4: Page Manager toolbar button | 30m |
| 🟡 M | MED-1: Custom zoom dropdown | 1h |
| 🟡 M | MED-4: Wire SearchHighlight into PdfDocument | 1h |
| 🟡 M | MED-5: Change default highlight color | 15m |
| 🟢 L | UI-1: Shimmer skeleton for page placeholders | 30m |
| 🟢 L | UI-6: Unify sidebar + overlay search UIs | 2h |
| 🟢 L | UI-7: Update HelpTooltip shortcuts | 15m |

---

## OUT OF SCOPE (v1.1 backlog — known design decisions)
- Real PDF annotation objects via pdf-lib (currently custom `%SharkViewAnnotations` trailer — works in SharkView only)
- Signature flatten/burn-in (DOM overlay approach is functional for v0.x)
- Page Manager full UI wiring
