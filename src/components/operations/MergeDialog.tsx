/**
 * MergeDialog.tsx
 * Merge multiple PDFs into one file.
 * Works in both Tauri (native dialogs) and browser (file input + download).
 */

import React, { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { tauriBridge } from "@/lib/tauri-bridge";

const IS_TAURI = "__TAURI_INTERNALS__" in window;

// ── Types ─────────────────────────────────────────────────────────────────────

interface PdfEntry {
  name: string;
  path?: string;   // Tauri mode: absolute path
  file?: File;     // Browser mode: File object
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MergeDialogProps {
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const MergeDialog: React.FC<MergeDialogProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<PdfEntry[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Add PDF ───────────────────────────────────────────────────────────────

  async function handleAddPdf() {
    if (IS_TAURI) {
      const path = await tauriBridge.openFileDialog();
      if (path) {
        const name = path.split(/[/\\]/).pop() ?? path;
        setEntries((prev) => [...prev, { name, path }]);
      }
    } else {
      fileInputRef.current?.click();
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const newEntries = files.map((f) => ({ name: f.name, file: f }));
    setEntries((prev) => [...prev, ...newEntries]);
    // Reset so the same file can be re-added
    e.target.value = "";
  }

  // ── Reorder / Remove ──────────────────────────────────────────────────────

  function handleRemove(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    setEntries((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function handleMoveDown(index: number) {
    setEntries((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  // ── Merge ─────────────────────────────────────────────────────────────────

  async function handleMerge() {
    if (entries.length < 2) {
      setStatus("Add at least 2 PDF files to merge.");
      return;
    }

    setBusy(true);
    setStatus(null);

    try {
      const merged = await PDFDocument.create();

      for (const entry of entries) {
        let bytes: Uint8Array;
        if (IS_TAURI && entry.path) {
          bytes = await tauriBridge.openPdf(entry.path);
        } else if (entry.file) {
          bytes = new Uint8Array(await entry.file.arrayBuffer());
        } else {
          continue;
        }
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }

      const mergedBytes = await merged.save();

      if (IS_TAURI) {
        const outputPath = await tauriBridge.saveFileDialog("merged.pdf");
        if (!outputPath) { setBusy(false); return; }
        await tauriBridge.savePdf(outputPath, mergedBytes);
        setStatus(`Merged successfully → ${outputPath}`);
      } else {
        // Browser: trigger download
        const blob = new Blob([mergedBytes as unknown as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "merged.pdf";
        a.click();
        URL.revokeObjectURL(url);
        setStatus("✅ Merged PDF downloaded!");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(`Error: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Hidden file input for browser mode */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div
        className="bg-shark-900 border border-shark-700 rounded-2xl shadow-2xl
                   w-[520px] max-w-[95vw] flex flex-col max-h-[80vh]"
        style={{ boxShadow: "0 0 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,160,23,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 border-b border-shark-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(212,160,23,0.15)", border: "1px solid rgba(212,160,23,0.25)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#D4A017" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-surface-100 font-semibold text-sm">Merge PDFs</h2>
          </div>
          <button
            type="button"
            className="w-7 h-7 flex items-center justify-center rounded-lg
                       text-shark-400 hover:text-surface-100 hover:bg-shark-800 transition-all text-lg"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <svg className="w-10 h-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-shark-500 text-xs text-center">
                {IS_TAURI ? 'Click "Add PDF" to select files.' : 'Click "Add PDF" — you can select multiple at once.'}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {entries.map((entry, i) => (
                <li
                  key={`${entry.name}-${i}`}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <span className="text-shark-500 text-xs w-5 text-right tabular-nums">{i + 1}.</span>
                  <svg className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="flex-1 text-xs text-surface-200 truncate" title={entry.name}>
                    {entry.name}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button type="button"
                      className="w-6 h-6 flex items-center justify-center rounded text-shark-400
                                 hover:text-surface-100 hover:bg-shark-700 transition-colors disabled:opacity-30"
                      onClick={() => handleMoveUp(i)} disabled={i === 0} aria-label="Move up">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button type="button"
                      className="w-6 h-6 flex items-center justify-center rounded text-shark-400
                                 hover:text-surface-100 hover:bg-shark-700 transition-colors disabled:opacity-30"
                      onClick={() => handleMoveDown(i)} disabled={i === entries.length - 1} aria-label="Move down">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button type="button"
                      className="w-6 h-6 flex items-center justify-center rounded text-shark-400
                                 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      onClick={() => handleRemove(i)} aria-label="Remove">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Status */}
        {status && (
          <p className={`px-5 text-xs pb-1 flex-shrink-0 ${status.startsWith("Error") ? "text-red-400" : "text-brand-300"}`}>
            {status}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center px-5 pb-5 pt-3 flex-shrink-0 border-t border-shark-800">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg
                       text-surface-200 transition-all duration-150 disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={handleAddPdf}
            disabled={busy}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add PDF
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded-lg text-surface-200 transition-all duration-150"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-1.5 text-sm rounded-lg text-white font-medium
                         transition-all duration-150 disabled:opacity-40"
              style={{
                background: entries.length >= 2 && !busy
                  ? "linear-gradient(135deg, #D4A017, #A87800)"
                  : "rgba(212,160,23,0.3)",
                boxShadow: entries.length >= 2 && !busy ? "0 2px 12px rgba(212,160,23,0.3)" : "none",
              }}
              onClick={handleMerge}
              disabled={busy || entries.length < 2}
            >
              {busy ? "Merging…" : `Merge ${entries.length > 0 ? `(${entries.length})` : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
