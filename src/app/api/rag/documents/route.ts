import { NextRequest, NextResponse } from "next/server";
import {
  ingestPdf,
  ingestTextDocument,
  listKnowledgeDocuments,
} from "@/server/services/rag/ragService";

export async function GET() {
  try {
    const documents = await listKnowledgeDocuments();
    return NextResponse.json({
      count: documents.length,
      documents,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to list documents", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const title = (formData.get("title") as string) || file?.name || "Uploaded Document";
      const source = (formData.get("source") as string) || "User Evidence Upload";

      if (!file) {
        return NextResponse.json({ error: "No file provided in form data." }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const result = await ingestPdf(buffer, file.name, source);
        return NextResponse.json({ success: true, ...result });
      } else {
        const text = buffer.toString("utf-8");
        const result = await ingestTextDocument(title, text, source, "user_evidence");
        return NextResponse.json({ success: true, ...result });
      }
    }

    const body = await req.json();
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: "Missing 'title' or 'content' in JSON body." },
        { status: 400 },
      );
    }

    const result = await ingestTextDocument(
      body.title,
      body.content,
      body.source || "Manual Ingestion",
      body.docType || "policy",
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: "Document ingestion failed", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
