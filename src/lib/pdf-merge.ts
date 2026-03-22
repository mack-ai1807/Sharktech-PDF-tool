/**
 * pdf-merge.ts
 * Merge multiple PDFs into one file using pdf-lib (pure JS — no Rust needed).
 */

import { PDFDocument } from "pdf-lib";
import { tauriBridge } from "./tauri-bridge";

/**
 * Merge an ordered list of PDF files into a single output file.
 * @param paths       Source PDF file paths (in merge order)
 * @param outputPath  Destination file path for the merged PDF
 */
export async function mergePdfs(
  paths: string[],
  outputPath: string
): Promise<void> {
  const merged = await PDFDocument.create();

  for (const path of paths) {
    const bytes = await tauriBridge.openPdf(path);
    const doc = await PDFDocument.load(bytes);
    const pageIndices = doc.getPageIndices();
    const copiedPages = await merged.copyPages(doc, pageIndices);
    copiedPages.forEach((page) => merged.addPage(page));
  }

  const mergedBytes = await merged.save();
  await tauriBridge.savePdf(outputPath, mergedBytes);
}
