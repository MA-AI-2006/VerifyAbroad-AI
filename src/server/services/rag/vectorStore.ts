import { DocumentChunk } from "./chunker";
import { cosineSimilarity, getEmbedding } from "./embeddings";

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
}

export interface IngestedDocument {
  id: string;
  title: string;
  source: string;
  docType: "pdf" | "policy" | "guideline" | "user_evidence";
  createdAt: string;
  chunkCount: number;
}

export class VectorStore {
  private chunks: DocumentChunk[] = [];
  private documents: Map<string, IngestedDocument> = new Map();

  public getDocumentCount(): number {
    return this.documents.size;
  }

  public getChunkCount(): number {
    return this.chunks.length;
  }

  public getDocuments(): IngestedDocument[] {
    return Array.from(this.documents.values());
  }

  public addDocumentMeta(doc: IngestedDocument) {
    this.documents.set(doc.id, doc);
  }

  public async addChunks(newChunks: DocumentChunk[]): Promise<void> {
    for (const chunk of newChunks) {
      if (!chunk.embedding || chunk.embedding.length === 0) {
        chunk.embedding = await getEmbedding(chunk.content);
      }
      this.chunks.push(chunk);
    }
  }

  /**
   * Vector similarity search with top-K and optional score threshold.
   */
  public async search(
    query: string,
    options: { topK?: number; minScore?: number; docId?: string } = {},
  ): Promise<SearchResult[]> {
    const topK = options.topK ?? 5;
    const minScore = options.minScore ?? 0.15;

    if (this.chunks.length === 0) {
      return [];
    }

    const queryEmbedding = await getEmbedding(query);

    const scored = this.chunks
      .filter((chunk) => (!options.docId ? true : chunk.docId === options.docId))
      .map((chunk) => {
        const score = chunk.embedding ? cosineSimilarity(queryEmbedding, chunk.embedding) : 0;
        return { chunk, score };
      })
      .filter((item) => item.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored;
  }

  public clear(): void {
    this.chunks = [];
    this.documents.clear();
  }
}

// Global singleton vector store instance
export const globalVectorStore = new VectorStore();
