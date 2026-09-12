import { GoogleGenAI } from "@google/genai";

const EMBEDDING_DIM = 256;
let genAiClient: GoogleGenAI | null = null;

function getGenAi(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) return null;
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });
  }
  return genAiClient;
}

/**
 * Computes cosine similarity between two float vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

/**
 * Deterministic semantic subword hash vectorizer for resilient offline/fallback operation.
 */
function deterministicEmbed(text: string): number[] {
  const vector = new Float32Array(EMBEDDING_DIM);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const words = normalized.split(/\s+/).filter((w) => w.length > 2);

  if (words.length === 0) return Array.from(vector);

  for (const word of words) {
    // Hash whole word
    let hash = 5381;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) + hash + word.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % EMBEDDING_DIM;
    vector[idx] += 1.0;

    // Subword 3-grams for morphological similarity
    for (let j = 0; j <= word.length - 3; j++) {
      const tri = word.slice(j, j + 3);
      let triHash = 0;
      for (let k = 0; k < tri.length; k++) {
        triHash = ((triHash << 5) + triHash + tri.charCodeAt(k)) | 0;
      }
      const triIdx = Math.abs(triHash) % EMBEDDING_DIM;
      vector[triIdx] += 0.4;
    }
  }

  // Normalize to unit length
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      vector[i] /= norm;
    }
  }

  return Array.from(vector);
}

/**
 * Generates an embedding vector for a given text snippet.
 * Uses Gemini text-embedding-004 when available, with deterministic fallback.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const clean = text.trim();
  if (!clean) return new Array(EMBEDDING_DIM).fill(0);

  const ai = getGenAi();
  if (ai) {
    try {
      const response = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: clean,
      });

      const values = response.embeddings?.[0]?.values;
      if (Array.isArray(values) && values.length > 0) {
        return values;
      }
    } catch {
      // Fall through to deterministic embedder
    }
  }

  return deterministicEmbed(clean);
}

/**
 * Generates embeddings in batch.
 */
export async function getEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    const emb = await getEmbedding(text);
    results.push(emb);
  }
  return results;
}
