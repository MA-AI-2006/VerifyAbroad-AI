export interface DocumentChunk {
  id: string;
  docId: string;
  docTitle: string;
  content: string;
  source: string;
  chunkIndex: number;
  pageNumber?: number;
  embedding?: number[];
}

export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

/**
 * Splits text into overlapping chunks, preferring paragraph and sentence boundaries.
 */
export function chunkText(
  text: string,
  docId: string,
  docTitle: string,
  source: string,
  options: ChunkOptions = {},
): DocumentChunk[] {
  const chunkSize = options.chunkSize ?? 600;
  const overlap = options.overlap ?? 80;

  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // Split by double newline (paragraphs) first
  const paragraphs = normalized.split(/\n\s*\n/);
  const chunks: DocumentChunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if ((currentChunk + "\n\n" + trimmed).length <= chunkSize) {
      currentChunk = currentChunk ? currentChunk + "\n\n" + trimmed : trimmed;
    } else {
      if (currentChunk.length > 0) {
        chunks.push({
          id: `${docId}-chunk-${chunkIndex++}`,
          docId,
          docTitle,
          content: currentChunk.trim(),
          source,
          chunkIndex: chunks.length,
        });

        // Retain overlap from end of previous chunk
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + " " + trimmed;
      } else {
        // Single paragraph larger than chunkSize: split by sentence
        const sentences = trimmed.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [trimmed];
        for (const sentence of sentences) {
          if ((currentChunk + " " + sentence).length <= chunkSize) {
            currentChunk = currentChunk ? currentChunk + " " + sentence : sentence;
          } else {
            if (currentChunk) {
              chunks.push({
                id: `${docId}-chunk-${chunkIndex++}`,
                docId,
                docTitle,
                content: currentChunk.trim(),
                source,
                chunkIndex: chunks.length,
              });
              currentChunk = currentChunk.slice(-overlap) + " " + sentence;
            } else {
              // Extremely long sentence: slice directly
              let remaining = sentence;
              while (remaining.length > 0) {
                const slice = remaining.slice(0, chunkSize);
                chunks.push({
                  id: `${docId}-chunk-${chunkIndex++}`,
                  docId,
                  docTitle,
                  content: slice.trim(),
                  source,
                  chunkIndex: chunks.length,
                });
                remaining = remaining.slice(chunkSize - overlap);
                if (remaining.length <= overlap) break;
              }
            }
          }
        }
      }
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `${docId}-chunk-${chunkIndex++}`,
      docId,
      docTitle,
      content: currentChunk.trim(),
      source,
      chunkIndex: chunks.length,
    });
  }

  return chunks;
}
