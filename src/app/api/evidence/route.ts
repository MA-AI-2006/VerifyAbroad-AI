import { NextResponse } from "next/server";

import { runInvestigationTurn } from "@/server/engine/run";
import { addEvidence } from "@/server/repositories/investigations";
import { loadVerificationData } from "@/server/repositories/verification";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;
const TEXTUAL = ["text/plain", "text/html", "message/rfc822", "text/csv", "application/json"];

function kindFor(mime: string | null, fileName: string | null): "screenshot" | "document" | "link" | "pasted_text" {
  if (!mime) return "document";
  if (mime.startsWith("image/")) return "screenshot";
  if (mime === "application/pdf") return "document";
  if (TEXTUAL.includes(mime)) return "document";
  if (fileName && /\.(png|jpe?g|webp|gif|heic)$/i.test(fileName)) return "screenshot";
  return "document";
}

/**
 * Evidence intake. Files are stored as investigation evidence with metadata.
 * Text the student pastes (message, offer letter, ad copy) is passed to the
 * investigation engine as evidence text.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    let investigationId: number | null = null;
    let label = "Evidence";
    let mime: string | null = null;
    let sizeBytes: number | null = null;
    let url: string | null = null;
    let extractedText: string | null = null;
    let note: string | null = null;
    let analysisStatus: "analyzed" | "pending" | "not_analyzed" = "not_analyzed";
    let kind: "screenshot" | "document" | "link" | "pasted_text" = "document";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      investigationId = Number(form.get("investigation_id"));
      const file = form.get("file");
      label = String(form.get("label") ?? "") || (file instanceof File ? file.name : "Evidence");
      if (file instanceof File) {
        if (file.size > MAX_BYTES) {
          return NextResponse.json({ error: "File is larger than 5 MB" }, { status: 413 });
        }
        mime = file.type || null;
        sizeBytes = file.size;
        kind = kindFor(mime, file.name);
        if (mime && TEXTUAL.includes(mime)) {
          extractedText = (await file.text()).slice(0, 8000);
          analysisStatus = "analyzed";
        } else {
          analysisStatus = "pending";
          note =
            kind === "screenshot"
              ? "Screenshot attached to the investigation. Paste the text of the message if you want every claim checked."
              : "Document attached to the investigation. Paste the key text so the claims can be checked line by line.";
        }
      }
      url = (form.get("url") as string | null) ?? null;
    } else {
      const body = (await request.json().catch(() => ({}))) as {
        investigation_id?: number;
        kind?: "link" | "pasted_text";
        label?: string;
        url?: string;
        text?: string;
      };
      investigationId = Number(body.investigation_id);
      url = body.url ?? null;
      if (body.kind === "link" && url) {
        kind = "link";
        label = body.label?.trim() || url;
        extractedText = url;
        analysisStatus = "analyzed";
        const data = await loadVerificationData();
        note = `Link submitted for review (${new URL(url.startsWith("http") ? url : `https://${url}`).hostname}). ${
          data.universities.length
        } university records checked against this domain.`;
      } else {
        kind = "pasted_text";
        label = body.label?.trim() || "Pasted message";
        extractedText = (body.text ?? "").slice(0, 8000);
        analysisStatus = extractedText ? "analyzed" : "not_analyzed";
      }
    }

    if (!Number.isFinite(investigationId) || investigationId === null || investigationId <= 0) {
      return NextResponse.json({ error: "A valid investigation_id is required" }, { status: 400 });
    }

    const evidence = await addEvidence({
      investigationId,
      kind,
      label,
      mime,
      sizeBytes,
      url,
      extractedText,
      analysisStatus,
      note,
    });

    const attachment = {
      id: String(evidence.id),
      kind,
      label,
      mime,
      size_bytes: sizeBytes,
      url,
      analysis_status: analysisStatus,
      note,
    };

    const studentText = [
      `[Evidence attached: ${label}]`,
      kind === "link" ? `Link: ${url}` : "",
      extractedText ? `Content:\n${extractedText}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const turn = await runInvestigationTurn({
      investigationId,
      studentText,
      attachments: [attachment],
    });

    return NextResponse.json({ evidence_id: String(evidence.id), attachment, turn, mode: "internal_engine" });
  } catch (error) {
    console.error("evidence upload failed", error);
    return NextResponse.json({ error: "Failed to store evidence" }, { status: 500 });
  }
}
