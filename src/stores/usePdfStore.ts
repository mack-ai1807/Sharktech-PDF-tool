import { create } from "zustand";
import type { PDFDocumentProxy } from "pdfjs-dist";

// ─── State ────────────────────────────────────────────────────────────────────

interface PdfDocState {
  /**
   * The live PDFDocumentProxy from PDF.js.
   * Non-serializable — stored outside devtools middleware intentionally.
   * null when no document is loaded.
   */
  pdfDoc: PDFDocumentProxy | null;
}

interface PdfDocActions {
  setPdfDoc: (doc: PDFDocumentProxy | null) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

/**
 * Holds the active PDFDocumentProxy.
 * Separate from viewerStore to avoid devtools serialisation issues.
 * Consumed by PdfDocument to render pages.
 */
export const usePdfStore = create<PdfDocState & PdfDocActions>()((set) => ({
  pdfDoc: null,
  setPdfDoc: (doc) => set({ pdfDoc: doc }),
}));
