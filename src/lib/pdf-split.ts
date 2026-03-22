/**
 * pdf-split.ts
 * Split a PDF into multiple files by page ranges using pdf-lib (pure JS — no Rust needed).
 */

import { PDFDocument } from "pdf-lib";
import { tauriBridge } from "./tauri-bridge";

/**
 * Split a PDF into separate files, one per range.
 *
 * @param path       Source PDF file path
 * @param ranges     Array of 0-indexed inclusive [start, end] page pairs
 * @param outputDir  Directory to write split output files
 * @returns          Paths of created files
 */
export async function splitPdf(
  path: string,
  ranges: [number, number][],
  outputDir: string
): Promise<string[]> {
  const bytes = await tauriBridge.openPdf(path);
  const src = await PDFDocument.load(bytes);
  const created: string[] = [];

  const baseName = path.split(/[/\\]/).pop()?.replace(/\.pdf$/i, "") ?? "split";

  for (let i = 0; i < ranges.length; i++) {
    const [start, end] = ranges[i];
    const doc = await PDFDocument.create();
    const indices = Array.from({ length: end - start + 1 }, (_, j) => start + j);
    const pages = await doc.copyPages(src, indices);
    pages.forEach((page) => doc.addPage(page));

    const outFileName = `${baseName}_part${i + 1}.pdf`;
    const outPath = `${outputDir}/${outFileName}`;
    const splitBytes = await doc.save();
    await tauriBridge.savePdf(outPath, splitBytes);
    created.push(outPath);
  }

  return created;
}
