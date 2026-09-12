import { GoogleGenAI } from "@google/genai";
import pdfParse from "pdf-parse";
import type { KnowledgeCitation } from "@/types";

/**
 * Knowledge Base & RAG Retrieval Engine for VerifyAbroad AI (RaastaAI).
 *
 * Supports:
 * - PDF parsing and text chunking
 * - Semantic vector embeddings via @google/genai (gemini-embedding-001 / text-embedding-004)
 * - Hybrid vector + keyword retrieval (BM25 token overlap)
 * - Preloaded knowledge documents (HEC, UKVI, German APS, US F-1, FIA Cybercrime)
 */

export interface KnowledgeChunk {
  id: string;
  documentTitle: string;
  source: string;
  section: string;
  text: string;
  embedding?: number[];
}

let genAiClient: GoogleGenAI | null = null;
function getGenAi(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) return null;
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return genAiClient;
}

// In-memory knowledge store (persisted for the lifetime of the process)
const knowledgeStore: KnowledgeChunk[] = [];
let initializedPreloaded = false;

/**
 * Splits text into readable chunks with sentence awareness.
 */
function chunkText(text: string, chunkSize = 500, overlap = 80): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= chunkSize) return [clean];

  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    let end = start + chunkSize;
    if (end < clean.length) {
      // Try to break on sentence or punctuation
      const nextDot = clean.lastIndexOf(".", end);
      const nextQuestion = clean.lastIndexOf("?", end);
      const nextExclamation = clean.lastIndexOf("!", end);
      const breakPoint = Math.max(nextDot, nextQuestion, nextExclamation);
      if (breakPoint > start + 100) {
        end = breakPoint + 1;
      }
    } else {
      end = clean.length;
    }

    const segment = clean.slice(start, end).trim();
    if (segment.length > 20) {
      chunks.push(segment);
    }
    start = end - overlap;
    if (start >= clean.length) break;
  }

  return chunks;
}

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Computes embedding using Gemini API if available.
 */
async function computeEmbedding(text: string): Promise<number[] | null> {
  const ai = getGenAi();
  if (!ai) return null;
  const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL ?? "text-embedding-004";

  try {
    const res = await ai.models.embedContent({
      model: embeddingModel,
      contents: text,
    });
    return res.embedding?.values ?? null;
  } catch {
    // Fallback: semantic vector generation not available
    return null;
  }
}

/**
 * Ingests a text document into the knowledge base.
 */
export async function ingestTextDocument(
  title: string,
  content: string,
  source: string,
  section = "General",
): Promise<number> {
  const segments = chunkText(content);
  let added = 0;

  for (let i = 0; i < segments.length; i++) {
    const chunkTextContent = segments[i];
    const embedding = await computeEmbedding(chunkTextContent);

    knowledgeStore.push({
      id: `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}_${i}`,
      documentTitle: title,
      source,
      section,
      text: chunkTextContent,
      embedding: embedding ?? undefined,
    });
    added++;
  }

  return added;
}

/**
 * Extracts plain text and page count from a PDF buffer.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const parser = new PDFParse({ data: buffer });
  try {
    await parser.load();
    const textResult = await parser.getText();
    const info = (await parser.getInfo().catch(() => ({ pages: 1 }))) as any;
    const pages = info?.pages ?? (textResult ? 1 : 0);
    const text = typeof textResult === "string" ? textResult : (textResult as any)?.text ?? "";
    return { text, pages };
  } finally {
    await parser.destroy().catch(() => {});
  }
}

/**
 * Ingests a PDF file buffer into the knowledge base using PDFParse.
 */
export async function ingestPdfBuffer(
  buffer: Buffer,
  title: string,
  source: string,
): Promise<{ chunkCount: number; pages: number }> {
  try {
    const { text, pages } = await extractTextFromPdf(buffer);
    const chunkCount = await ingestTextDocument(
      title,
      text,
      source,
      `PDF Extracted Document (${pages} pages)`,
    );
    return { chunkCount, pages };
  } catch (error) {
    console.error("PDF Parsing error:", error);
    throw new Error(`Failed to parse PDF document: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Preload foundational study-abroad verification intelligence documents.
 */
export function preloadFoundationalDirectives() {
  if (initializedPreloaded && knowledgeStore.length > 0) return;
  initializedPreloaded = true;

  const DIRECTIVES = [
    {
      title: "Pakistan Higher Education Commission (HEC) Equivalence Guidelines",
      source: "HEC Pakistan Official Directives (des.hec.gov.pk)",
      section: "Foreign Degree Recognition & Attestation",
      content: `The Higher Education Commission (HEC) of Pakistan recognizes degrees from foreign universities only if the institution is chartered, accredited by the host country's official education authority, and listed in WHED (World Higher Education Database). Degrees obtained from unauthorized franchise campuses or offshore operations not approved by HEC will not be attested. HEC warns students against unregistered local agents claiming guaranteed equivalence. Students must independently confirm university recognition on the HEC portal before paying tuition deposits.`,
    },
    {
      title: "UK Visas & Immigration (UKVI) & CAS Regulations",
      source: "UK Home Office & British Council Study Guidelines",
      section: "Student Route (CAS & Financial Sponsorship)",
      content: `A Confirmation of Acceptance for Studies (CAS) can only be generated directly by a UKVI-licensed Student Sponsor institution. No education consultant, recruitment agent, or third party has authority to issue a CAS or guarantee a UK Student Visa. All tuition deposits and fee payments must be remitted directly to the university's designated institutional bank account, typically via Convera or Flywire. Consultants who demand cash, transfers to personal Pakistani bank accounts, or withhold original academic credentials are in breach of UKVI compliance standards.`,
    },
    {
      title: "Germany APS & Blocked Account (Sperrkonto) Protocols",
      source: "DAAD & German Embassy Islamabad Official Directives",
      section: "APS Certificate & Proof of Financial Resources",
      content: `All Pakistani students applying for German higher education institutions must obtain an APS (Akademische Prüfstelle) verification certificate through the German Embassy Islamabad. Tuition at almost all public universities in Germany is completely free (except state of Baden-Württemberg). The mandatory Proof of Financial Resources must be placed into a federally recognized blocked account (Sperrkonto) opened directly by the student with official providers such as Expatrio, Coracle, or Fintiba. Never transfer living expense funds to a consultant's personal bank account or third-party agent.`,
    },
    {
      title: "United States F-1 Visa & SEVIS I-901 Compliance Rules",
      source: "U.S. Department of State & EducationUSA Pakistan",
      section: "Form I-20 Issuance & Visa Interview Integrity",
      content: `Form I-20 Certificate of Eligibility for Nonimmigrant Student Status is issued exclusively by the Designated School Official (DSO) of a certified SEVP institution. The mandatory SEVIS I-901 fee must be paid directly on the official US government portal (fmjfee.com). The US Embassy in Islamabad and Consulate General in Karachi maintain that no third party can schedule emergency interview slots for money or guarantee visa issuance. Forged bank statements or fraudulent sponsorship letters result in permanent ineligibility under INA 212(a)(6)(C)(i).`,
    },
    {
      title: "FIA Cybercrime & Banking Golden Hour Emergency Protocol",
      source: "Federal Investigation Agency (FIA) Cyber Crime Wing & SBP Directives",
      section: "Financial Fraud Recovery & Evidence Safeguarding",
      content: `In the event of study abroad fraud or unauthorized funds transfer to fraudulent accounts (Easypaisa, JazzCash, Meezan Bank, Sadapay, Nayapay): 1. Immediately call your bank helpline within the first 2-4 hours ('Golden Hour') to request an emergency transaction freeze and report fraud. 2. File an official complaint with the FIA Cyber Crime Wing via complaint.fia.gov.pk or call the 1991 helpline. 3. Preserve complete evidence: WhatsApp chat exports with media, payment deposit slips, CNIC copies of the recipient, call recordings, and email headers. Never delete chat threads with fraudulent consultants.`,
    },
  ];

  for (const doc of DIRECTIVES) {
    ingestTextDocument(doc.title, doc.content, doc.source, doc.section);
  }
}

/**
 * Searches the knowledge base using semantic vector cosine similarity + BM25 keyword matching.
 */
export async function queryKnowledgeBase(
  query: string,
  topK = 3,
): Promise<KnowledgeCitation[]> {
  preloadFoundationalDirectives();

  const trimmed = query.trim().toLowerCase();
  if (!trimmed || knowledgeStore.length === 0) return [];

  const queryEmbedding = await computeEmbedding(query);
  const queryTokens = trimmed.split(/\s+/).filter((t) => t.length > 2);

  const scored = knowledgeStore.map((chunk) => {
    let score = 0;

    // 1. Vector cosine similarity if available
    if (queryEmbedding && chunk.embedding) {
      const cos = cosineSimilarity(queryEmbedding, chunk.embedding);
      score += cos * 0.75;
    }

    // 2. Keyword overlap score
    const textLower = chunk.text.toLowerCase();
    const docLower = chunk.documentTitle.toLowerCase();
    let matches = 0;
    for (const token of queryTokens) {
      if (textLower.includes(token)) matches += 1;
      if (docLower.includes(token)) matches += 2;
    }
    const tokenScore = matches / (queryTokens.length + 1);
    score += tokenScore * 0.45;

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map(({ chunk, score }) => ({
    document_title: chunk.documentTitle,
    source: chunk.source,
    section: chunk.section,
    snippet: chunk.text,
    relevance_score: Math.round(score * 100) / 100,
  }));
}
