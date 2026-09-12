import { PDFParse } from "pdf-parse";

export interface ParsedPdfDocument {
  text: string;
  numPages: number;
  info?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Extracts plain text and metadata from a PDF file buffer.
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedPdfDocument> {
  try {
    const parser = new PDFParse({ data: buffer });
    const textData = await parser.getText();
    const text = (typeof textData === "string" ? textData : (textData as { text?: string })?.text ?? "")
      .replace(/\u0000/g, "")
      .trim();

    return {
      text: text || fallbackExtractPdfText(buffer),
      numPages: 1,
    };
  } catch (error) {
    // Fallback: extract text streams manually if pdf-parse encounters format quirks
    const text = fallbackExtractPdfText(buffer);
    if (text) {
      return {
        text,
        numPages: 1,
      };
    }
    throw new Error(
      `Failed to parse PDF document: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Fallback regex-based text stream extractor for raw PDF buffers.
 */
function fallbackExtractPdfText(buffer: Buffer): string {
  const str = buffer.toString("latin1");
  const textBlocks: string[] = [];

  // Match text objects BT ... ET
  const matches = str.matchAll(/BT[\s\S]*?ET/g);
  for (const match of matches) {
    const block = match[0];
    const stringLiterals = block.matchAll(/\(([^)]+)\)/g);
    for (const lit of stringLiterals) {
      if (lit[1]) textBlocks.push(lit[1]);
    }
  }

  return textBlocks.join(" ").replace(/\s+/g, " ").trim();
}
