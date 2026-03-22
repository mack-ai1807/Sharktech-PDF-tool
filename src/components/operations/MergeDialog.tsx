/**
 * MergeDialog.tsx
 * Dialog to merge multiple PDFs into one file.
 */

import React, { useState } from "react";
import { tauriBridge } from "@/lib/tauri-bridge";
import { mergePdfs } from "@/lib/pdf-merge";

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MergeDialogProps {
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const MergeDialog: React.FC<MergeDialogProps> = ({ onClose }) => {
  const [files, setFiles] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAddPdf() {
    const path = await tauriBridge.openFileDialog();
    if (path) {
      setFiles((prev) => [...prev, path]);
    }
  }

  function handleRemove(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    setFiles((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function handleMoveDown(index: number) {
    setFiles((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  async function handleMerge() {
    if (files.length < 2) {
      setStatus("Add at least 2 PDF files to merge.");
      return;
    }
    const outputPath = await tauriBridge.saveFileDialog("merged.pdf");
    if (!outputPath) return;
    setBusy(true);
    setStatus(null);
    try {
      await mergePdfs(files, outputPath);
      setStatus(`Merged successfully → ${outputPath}`);
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
                   w-[520px] max-w-[95vw] flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <h2 className="text-surface-100 font-semibold text-sm">Merge PDFs</h2>
          <button
            type="button"
            className="text-shark-400 hover:text-surface-100 transition-colors text-lg"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* File list */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {files.length === 0 ? (
            <p className="text-shark-500 text-xs py-4 text-center">
              No files added yet. Click "Add PDF" to begin.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {files.map((f, i) => (
                <li
                  key={`${f}-${i}`}
                  className="flex items-center gap-2 bg-shark-800 rounded px-3 py-2"
                >
                  <span className="text-shark-500 text-xs w-5 text-right">{i + 1}.</span>
                  <span
                    className="flex-1 text-xs text-surface-200 truncate"
                    title={f}
                  >
                    {f.split(/[/\\]/).pop() ?? f}
                  </span>
                  <button
                    type="button"
                    className="text-shark-400 hover:text-surface-100 text-xs px-1"
                    onClick={() => handleMoveUp(i)}
                    disabled={i === 0}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="text-shark-400 hover:text-surface-100 text-xs px-1"
                    onClick={() => handleMoveDown(i)}
                    disabled={i === files.length - 1}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="text-shark-400 hover:text-red-400 text-xs px-1"
                    onClick={() => handleRemove(i)}
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Status */}
        {status && (
          <p className="px-5 text-xs text-surface-400 pb-1 flex-shrink-0">
            {status}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center px-5 pb-4 pt-2 flex-shrink-0">
          <button
            type="button"
            className="px-3 py-1.5 text-sm bg-shark-700 hover:bg-shark-600
                       text-surface-200 rounded transition-colors"
            onClick={handleAddPdf}
            disabled={busy}
          >
            + Add PDF
          </button>
          <div className="flex gap-2">
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
              onClick={handleMerge}
              disabled={busy || files.length < 2}
            >
              {busy ? "Merging…" : "Merge"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
