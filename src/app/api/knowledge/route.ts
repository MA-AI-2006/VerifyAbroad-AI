import { NextResponse } from "next/server";
import {
  queryKnowledgeBase,
  ingestTextDocument,
  ingestPdfBuffer,
  preloadFoundationalDirectives,
} from "@/server/services/knowledgeBase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    preloadFoundationalDirectives();
    const url = new URL(request.url);
    const q = url.searchParams.get("q");
    const topK = Number(url.searchParams.get("topK") ?? 4);

    if (!q) {
      return NextResponse.json({
        message: "Knowledge base active. Pass ?q=... to search verified policy documents.",
      });
    }

    const citations = await queryKnowledgeBase(q, topK);
    return NextResponse.json({
      query: q,
      citations,
    });
  } catch (error) {
    console.error("Knowledge query error:", error);
    return NextResponse.json(
      { error: "Failed to query knowledge base" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    // Check if multipart form upload (e.g. PDF file)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const title = (formData.get("title") as string) || file?.name || "Uploaded Document";
      const source = (formData.get("source") as string) || "User Uploaded Policy Document";

      if (!file) {
        return NextResponse.json({ error: "No file provided in form data" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const result = await ingestPdfBuffer(buffer, title, source);
        return NextResponse.json({
          success: true,
          type: "pdf",
          title,
          pages: result.pages,
          chunks: result.chunkCount,
        });
      } else {
        const text = buffer.toString("utf-8");
        const chunkCount = await ingestTextDocument(title, text, source);
        return NextResponse.json({
          success: true,
          type: "text",
          title,
          chunks: chunkCount,
        });
      }
    }

    // JSON text document ingestion
    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      content?: string;
      source?: string;
      section?: string;
    };

    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Both 'title' and 'content' are required for document ingestion" },
        { status: 400 },
      );
    }

    const chunks = await ingestTextDocument(
      body.title,
      body.content,
      body.source ?? "Manual Upload",
      body.section ?? "Direct Ingestion",
    );

    return NextResponse.json({
      success: true,
      title: body.title,
      chunks,
    });
  } catch (error) {
    console.error("Knowledge ingestion error:", error);
    return NextResponse.json(
      { error: "Failed to ingest into knowledge base", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
