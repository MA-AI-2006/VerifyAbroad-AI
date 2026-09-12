import { GoogleGenAI } from "@google/genai";
import { chunkText, DocumentChunk } from "./chunker";
import { parsePdfBuffer } from "./pdfParser";
import { SEED_KNOWLEDGE_DOCUMENTS } from "./seedKnowledge";
import { globalVectorStore, IngestedDocument, SearchResult } from "./vectorStore";

let initialized = false;
let initPromise: Promise<void> | null = null;

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
 * Initializes the RAG Knowledge Base with official seed policy documents.
 */
export async function initializeKnowledgeBase(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    for (const doc of SEED_KNOWLEDGE_DOCUMENTS) {
      const chunks = chunkText(doc.content, doc.id, doc.title, doc.source, {
        chunkSize: 500,
        overlap: 70,
      });

      globalVectorStore.addDocumentMeta({
        id: doc.id,
        title: doc.title,
        source: doc.source,
        docType: doc.docType,
        createdAt: new Date().toISOString(),
        chunkCount: chunks.length,
      });

      await globalVectorStore.addChunks(chunks);
    }
    initialized = true;
  })();

  return initPromise;
}

export interface RagQueryResult {
  query: string;
  retrievedCount: number;
  results: Array<{
    title: string;
    source: string;
    content: string;
    score: number;
  }>;
}

/**
 * Semantic vector retrieval from the official Knowledge Base.
 */
export async function queryKnowledgeBase(
  query: string,
  options?: { topK?: number; minScore?: number },
): Promise<RagQueryResult> {
  await initializeKnowledgeBase();

  const searchResults = await globalVectorStore.search(query, {
    topK: options?.topK ?? 4,
    minScore: options?.minScore ?? 0.1,
  });

  return {
    query,
    retrievedCount: searchResults.length,
    results: searchResults.map((r) => ({
      title: r.chunk.docTitle,
      source: r.chunk.source,
      content: r.chunk.content,
      score: Math.round(r.score * 1000) / 1000,
    })),
  };
}

/**
 * Ingests and indexes an uploaded PDF document into the vector knowledge base.
 */
export async function ingestPdf(
  buffer: Buffer,
  fileName: string,
  sourceLabel?: string,
): Promise<{ docId: string; chunkCount: number; numPages: number }> {
  await initializeKnowledgeBase();

  const parsed = await parsePdfBuffer(buffer);
  const docId = `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const title = fileName.replace(/\.[^/.]+$/, "");
  const source = sourceLabel || `Uploaded Document: ${fileName}`;

  const chunks = chunkText(parsed.text, docId, title, source, {
    chunkSize: 600,
    overlap: 80,
  });

  globalVectorStore.addDocumentMeta({
    id: docId,
    title,
    source,
    docType: "pdf",
    createdAt: new Date().toISOString(),
    chunkCount: chunks.length,
  });

  await globalVectorStore.addChunks(chunks);

  return {
    docId,
    chunkCount: chunks.length,
    numPages: parsed.numPages,
  };
}

/**
 * Ingests arbitrary text into the knowledge base.
 */
export async function ingestTextDocument(
  title: string,
  content: string,
  source: string,
  docType: "policy" | "guideline" | "user_evidence" = "user_evidence",
): Promise<{ docId: string; chunkCount: number }> {
  await initializeKnowledgeBase();

  const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const chunks = chunkText(content, docId, title, source, {
    chunkSize: 500,
    overlap: 70,
  });

  globalVectorStore.addDocumentMeta({
    id: docId,
    title,
    source,
    docType,
    createdAt: new Date().toISOString(),
    chunkCount: chunks.length,
  });

  await globalVectorStore.addChunks(chunks);

  return { docId, chunkCount: chunks.length };
}

/**
 * Retrieves all indexed documents in the knowledge base.
 */
export async function listKnowledgeDocuments(): Promise<IngestedDocument[]> {
  await initializeKnowledgeBase();
  return globalVectorStore.getDocuments();
}

/**
 * Synthesizes an authoritative answer backed by retrieved RAG knowledge chunks.
 */
export async function answerWithRag(query: string): Promise<{
  answer: string;
  sources: Array<{ title: string; source: string; score: number }>;
}> {
  const retrieval = await queryKnowledgeBase(query, { topK: 4 });
  const sources = retrieval.results.map((r) => ({
    title: r.title,
    source: r.source,
    score: r.score,
  }));

  const ai = getGenAi();
  if (ai && retrieval.results.length > 0) {
    try {
      const contextBlocks = retrieval.results
        .map(
          (r, idx) =>
            `[Source ${idx + 1}: ${r.title} (${r.source})]\n${r.content}`,
        )
        .join("\n\n");

      const prompt = `You are the VerifyAbroad Knowledge Base Officer.
Answer the following student question using ONLY the provided official reference documents below.
If the documents do not cover the answer, state what official guidelines recommend.
Always cite the relevant policy and official source.

Official Reference Documents:
${contextBlocks}

Student Question:
${query}

Authoritative Answer:`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.2,
        },
      });

      if (response.text?.trim()) {
        return {
          answer: response.text.trim(),
          sources,
        };
      }
    } catch {
      // Fall through to structured summary
    }
  }

  // Deterministic synthesis when LLM is unavailable
  if (retrieval.results.length === 0) {
    return {
      answer:
        "No matching official guidelines were found in the knowledge base for this query. Please check official embassy or university websites directly.",
      sources: [],
    };
  }

  const answer = `Based on official policy guidelines:\n\n${retrieval.results
    .map((r) => `• From ${r.title}:\n  ${r.content.slice(0, 240)}...`)
    .join("\n\n")}`;

  return {
    answer,
    sources,
  };
}
