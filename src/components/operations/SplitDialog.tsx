/**
 * SplitDialog.tsx
 * Split PDF into page ranges.
 * Works in both Tauri (native folder dialog + write) and browser (in-memory + download).
 * Exported pure function `parsePageRanges` is used in tests.
 */

import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { tauriBridge } from "@/lib/tauri-bridge";
import { splitPdf } from "@/lib/pdf-split";
import { useViewerStore } from "@/stores/useViewerStore";

const IS_TAURI = "__TAURI_INTERNALS__" in window;

// ── Pure utility (exported for tests) ────────────────────────────────────────

/**
 * Parse a human-readable page-range string into 0-indexed [start, end] pairs.
 *
 * Input examples: "1-3, 4-10, 11"
 * Output: [[0,2], [3,9], [10,10]] — 0-indexed inclusive ranges
 *
 * @param input      The page-range string
 * @param totalPages Total page count (used for bounds checking)
 * @throws If page numbers are invalid, out of order, or exceed totalPages
 */
export function parsePageRanges(
  input: string,
  totalPages: number
): [number, number][] {
  const parts = input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const result: [number, number][] = [];

  for (const part of parts) {
    if (part.includes("-")) {
      const [rawStart, rawEnd] = part.split("-").map((s) => s.trim());
      const start = parseInt(rawStart, 10);
      const end = parseInt(rawEnd, 10);

      if (isNaN(start) || isNaN(end)) throw new Error(`Invalid range "${part}"`);
      if (start < 1 || end < 1) throw new Error("Page numbers start at 1");
      if (start > end) throw new Error(`Invalid range ${start}-${end}`);
      if (start > totalPages) throw new Error(`Page ${start} exceeds total ${totalPages}`);
      if (end > totalPages) throw new Error(`Page ${end} exceeds total ${totalPages}`);
      result.push([start - 1, end - 1]);
    } else {
      const page = parseInt(part, 10);
      if (isNaN(page)) throw new Error(`Invalid page number "${part}"`);
      if (page < 1) throw new Error("Page numbers start at 1");
      if (page > totalPages) throw new Error(`Page ${page} exceeds total ${totalPages}`);
      result.push([page - 1, page - 1]);
    }
  }

  return result;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SplitDialogProps {
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SplitDialog: React.FC<SplitDialogProps> = ({ onClose }) => {
  const filePath   = useViewerStore((s) => s.filePath);
  const fileName   = useViewerStore((s) => s.fileName);
  const totalPages = useViewerStore((s) => s.totalPages);
  const fileBuffer = useViewerStore((s) => s.fileBuffer);

  const [rangeInput, setRangeInput]   = useState("");
  const [outputDir, setOutputDir]     = useState<string | null>(null);
  const [status, setStatus]           = useState<string | null>(null);
  const [createdFiles, setCreatedFiles] = useState<string[]>([]);
  const [busy, setBusy]               = useState(false);
  const [parseError, setParseError]   = useState<string | null>(null);

  function handleRangeChange(value: string) {
    setRangeInput(value);
    setParseError(null);
  }

  async function handleSelectFolder() {
    const dir = await tauriBridge.openFolderDialog();
    if (dir) setOutputDir(dir);
  }

  // Quick-fill helpers
  function fillAllPages() { setRangeInput(`1-${totalPages}`); setParseError(null); }
  function fillEachPage() {
    setRangeInput(Array.from({ length: totalPages }, (_, i) => i + 1).join(", "));
    setParseError(null);
  }

  async function handleSplit() {
    if (!fileBuffer && !filePath) {
      setStatus("No PDF file is currently open.");
      return;
    }

    let zeroBased: [number, number][];
    try {
      zeroBased = parsePageRanges(rangeInput, totalPages);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setParseError(msg);
      return;
    }

    if (zeroBased.length === 0) {
      setParseError("Enter at least one page range.");
      return;
    }

    setBusy(true);
    setStatus(null);
    setCreatedFiles([]);

    try {
      if (IS_TAURI && filePath) {
        // ── Tauri path: write files to selected folder ──────────────────────
        if (!outputDir) {
          const dir = await tauriBridge.openFolderDialog();
          if (!dir) { setBusy(false); return; }
          setOutputDir(dir);
          const files = await splitPdf(filePath, zeroBased, dir);
          setCreatedFiles(files.map((f) => f.split(/[/\\]/).pop() ?? f));
          setStatus(`✅ Split into ${files.length} file(s) in: ${dir}`);
        } else {
          const files = await splitPdf(filePath, zeroBased, outputDir);
          setCreatedFiles(files.map((f) => f.split(/[/\\]/).pop() ?? f));
          setStatus(`✅ Split into ${files.length} file(s) in: ${outputDir}`);
        }
      } else if (fileBuffer) {
        // ── Browser path: split in-memory, trigger downloads ────────────────
        const src = await PDFDocument.load(fileBuffer);
        const baseName = (fileName ?? "document").replace(/\.pdf$/i, "");
        const downloadedFiles: string[] = [];

        for (let i = 0; i < zeroBased.length; i++) {
          const [start, end] = zeroBased[i];
          const doc = await PDFDocument.create();
          const indices = Array.from({ length: end - start + 1 }, (_, j) => start + j);
          const pages = await doc.copyPages(src, indices);
          pages.forEach((p) => doc.addPage(p));

          const splitBytes = await doc.save();
          const outName = `${baseName}_part${i + 1}.pdf`;

          const blob = new Blob([splitBytes as unknown as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = outName;
          a.click();
          URL.revokeObjectURL(url);

          downloadedFiles.push(outName);
          // Small delay between downloads to avoid browser blocking
          await new Promise((r) => setTimeout(r, 150));
        }

        setCreatedFiles(downloadedFiles);
        setStatus(`✅ Downloaded ${downloadedFiles.length} split file(s).`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(`Error: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  const canSplit = !!rangeInput.trim() && (!!filePath || !!fileBuffer) && totalPages > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-shark-900 border border-shark-700 rounded-2xl shadow-2xl
                   w-[480px] max-w-[95vw] flex flex-col"
        style={{ boxShadow: "0 0 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,160,23,0.08)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-shark-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(212,160,23,0.15)", border: "1px solid rgba(212,160,23,0.25)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#D4A017" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-surface-100 font-semibold text-sm">Split PDF</h2>
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

        <div className="px-5 pb-5 pt-4 flex flex-col gap-4">
          {/* File info */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <svg className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-shark-400 text-xs truncate">
              {fileName ?? "No file open"}{totalPages > 0 && ` · ${totalPages} pages`}
            </p>
          </div>

          {/* Range input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-surface-300 font-medium">
                Page ranges
              </label>
              <div className="flex gap-1.5">
                <button type="button"
                  onClick={fillAllPages}
                  className="text-[10px] px-2 py-0.5 rounded text-shark-400 hover:text-surface-200 transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  All
                </button>
                <button type="button"
                  onClick={fillEachPage}
                  className="text-[10px] px-2 py-0.5 rounded text-shark-400 hover:text-surface-200 transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  Each page
                </button>
              </div>
            </div>
            <input
              type="text"
              value={rangeInput}
              onChange={(e) => handleRangeChange(e.target.value)}
              placeholder="e.g. 1-3, 4-10, 11"
              className="w-full px-3 py-2 rounded-xl text-surface-100 placeholder:text-shark-500 text-sm
                         focus:outline-none transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${parseError ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.08)"}`,
              }}
              aria-label="Page ranges"
            />
            {parseError && (
              <p className="text-red-400 text-xs">{parseError}</p>
            )}
            <p className="text-[10px] text-shark-500">
              Separate ranges with commas. Each range creates one output file.
              {!IS_TAURI && " Files will be downloaded to your Downloads folder."}
            </p>
          </div>

          {/* Output folder (Tauri only) */}
          {IS_TAURI && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-surface-200 flex-shrink-0 transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                onClick={handleSelectFolder}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Output Folder
              </button>
              {outputDir && (
                <span className="text-xs text-surface-400 truncate" title={outputDir}>
                  {outputDir.split(/[/\\]/).pop() ?? outputDir}
                </span>
              )}
            </div>
          )}

          {/* Status */}
          {status && (
            <p className={`text-xs ${status.startsWith("Error") ? "text-red-400" : "text-brand-300"}`}>
              {status}
            </p>
          )}

          {/* Created files list */}
          {createdFiles.length > 0 && (
            <ul className="flex flex-col gap-1 max-h-28 overflow-y-auto rounded-xl p-2"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              {createdFiles.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-surface-300">
                  <svg className="w-3 h-3 text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="truncate">{f}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded-lg text-surface-200 transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-1.5 text-sm rounded-lg text-white font-medium transition-all disabled:opacity-40"
              style={{
                background: canSplit && !busy
                  ? "linear-gradient(135deg, #D4A017, #A87800)"
                  : "rgba(212,160,23,0.3)",
                boxShadow: canSplit && !busy ? "0 2px 12px rgba(212,160,23,0.3)" : "none",
              }}
              onClick={handleSplit}
              disabled={busy || !canSplit}
            >
              {busy ? "Splitting…" : "Split PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
