/**
 * SplitDialog.tsx
 * Split PDF into page ranges.
 * Exported pure function `parsePageRanges` is used in tests.
 */

import React, { useState } from "react";
import { tauriBridge } from "@/lib/tauri-bridge";
import { splitPdf } from "@/lib/pdf-split";
import { useViewerStore } from "@/stores/useViewerStore";

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

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range "${part}"`);
      }
      if (start < 1 || end < 1) {
        throw new Error("Page numbers start at 1");
      }
      if (start > end) {
        throw new Error(`Invalid range ${start}-${end}`);
      }
      if (start > totalPages) {
        throw new Error(`Page ${start} exceeds total ${totalPages}`);
      }
      if (end > totalPages) {
        throw new Error(`Page ${end} exceeds total ${totalPages}`);
      }
      result.push([start - 1, end - 1]);
    } else {
      const page = parseInt(part, 10);
      if (isNaN(page)) {
        throw new Error(`Invalid page number "${part}"`);
      }
      if (page < 1) {
        throw new Error("Page numbers start at 1");
      }
      if (page > totalPages) {
        throw new Error(`Page ${page} exceeds total ${totalPages}`);
      }
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
  const filePath = useViewerStore((s) => s.filePath);
  const totalPages = useViewerStore((s) => s.totalPages);

  const [rangeInput, setRangeInput] = useState("");
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [createdFiles, setCreatedFiles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  function handleRangeChange(value: string) {
    setRangeInput(value);
    setParseError(null);
  }

  async function handleSelectFolder() {
    const dir = await tauriBridge.openFolderDialog();
    if (dir) setOutputDir(dir);
  }

  async function handleSplit() {
    if (!filePath) {
      setStatus("No PDF file is currently open.");
      return;
    }
    if (!outputDir) {
      setStatus("Please select an output folder.");
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

    setBusy(true);
    setStatus(null);
    setCreatedFiles([]);
    try {
      const files = await splitPdf(filePath, zeroBased, outputDir);
      setCreatedFiles(files);
      setStatus(`Split into ${files.length} file(s).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus(`Error: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-shark-900 border border-shark-700 rounded-xl shadow-2xl
                   w-[480px] max-w-[95vw] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-surface-100 font-semibold text-sm">Split PDF</h2>
          <button
            type="button"
            className="text-shark-400 hover:text-surface-100 transition-colors text-lg"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-5 pb-4 flex flex-col gap-3">
          {/* File info */}
          <p className="text-shark-500 text-xs">
            {filePath
              ? `File: ${filePath.split(/[/\\]/).pop()}`
              : "No file open"}
            {totalPages > 0 && ` (${totalPages} pages)`}
          </p>

          {/* Range input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-surface-300">
              Page ranges (e.g. 1-3, 4-10, 11)
            </label>
            <input
              type="text"
              value={rangeInput}
              onChange={(e) => handleRangeChange(e.target.value)}
              placeholder="1-3, 4-10, 11"
              className="w-full px-3 py-2 bg-shark-800 border border-shark-600 rounded
                         text-surface-100 placeholder:text-shark-500
                         focus:outline-none focus:border-brand-500 text-sm"
              aria-label="Page ranges"
            />
            {parseError && (
              <p className="text-red-400 text-xs">{parseError}</p>
            )}
          </div>

          {/* Output folder */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-sm bg-shark-700 hover:bg-shark-600
                         text-surface-200 rounded transition-colors flex-shrink-0"
              onClick={handleSelectFolder}
            >
              Select Output Folder
            </button>
            {outputDir && (
              <span className="text-xs text-surface-400 truncate" title={outputDir}>
                {outputDir}
              </span>
            )}
          </div>

          {/* Status */}
          {status && (
            <p className="text-xs text-surface-400">{status}</p>
          )}

          {/* Created files list */}
          {createdFiles.length > 0 && (
            <ul className="flex flex-col gap-0.5 max-h-32 overflow-y-auto">
              {createdFiles.map((f) => (
                <li key={f} className="text-xs text-surface-300 truncate">
                  {f.split(/[/\\]/).pop() ?? f}
                </li>
              ))}
            </ul>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              className="px-3 py-1.5 text-sm bg-shark-700 hover:bg-shark-600
                         text-surface-200 rounded transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-sm bg-brand-600 hover:bg-brand-500
                         text-white rounded transition-colors disabled:opacity-40"
              onClick={handleSplit}
              disabled={busy || !filePath || !outputDir || !rangeInput.trim()}
            >
              {busy ? "Splitting…" : "Split"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
