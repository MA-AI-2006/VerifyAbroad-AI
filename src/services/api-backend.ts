/**
 * Integration bridge between frontend and backend.
 *
 * This file adapts the old api.ts contract to use the new backend-client.ts
 * when BACKEND_URL is configured. When not configured, it falls back to
 * the built-in Next.js routes.
 */

import type {
  ChatAttachment,
  ChatMessage,
  DegreeLevel,
  EngineTurnResponse,
  InvestigationListItem,
  InvestigationRecord,
  InvestigationResult,
  KnowledgeCitation,
  Language,
  LiveIntelligenceFinding,
  SanctionsFinding,
  StudentProfile,
} from "@/types";
import { demoAttachmentFromCase, demoCase, demoFollowUps } from "@/data/mock/demoCase";
import { getStudentKey } from "./session";
import * as backendClient from "./backend-client";

const USE_BACKEND = Boolean(
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL
);

const RAW_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
const API_BASE = RAW_BASE.replace(/\/$/, "");

export const backendMode: "external_backend" | "internal_engine" =
  USE_BACKEND ? "external_backend" : "internal_engine";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Fallback to internal Next.js routes when backend is not available
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      /* ignore body parse errors */
    }
    throw new ApiError(message, response.status);
  }
  return (await response.json()) as T;
}

export interface StartInvestigationInput {
  message?: string;
  language?: Language;
  attachments?: ChatAttachment[];
}

export interface SendMessageInput {
  message: string;
  attachments?: ChatAttachment[];
  degree_level?: DegreeLevel | null;
  funding_type?: InvestigationRecord["context"]["funding_type"] | null;
}

export const api = {
  async startInvestigation(input: StartInvestigationInput) {
    if (USE_BACKEND) {
      try {
        const result = await backendClient.investigations.start({
          initial_message: input.message ?? "",
          language: input.language,
        });
        return {
          investigation_id: result.investigation_id,
          investigation: {
            id: parseInt(result.investigation_id),
            messages: [],
            context: {},
          } as InvestigationRecord,
          first_turn: {
            assistantMessage: {
              role: "assistant",
              content: result.assistant_message,
              timestamp: new Date().toISOString(),
            } as ChatMessage,
            result: null,
          },
          mode: "external_backend" as const,
        };
      } catch (error) {
        if (error instanceof backendClient.BackendError) {
          throw new ApiError(error.message, error.status);
        }
        throw error;
      }
    }
    return request<{
      investigation_id: string;
      investigation: InvestigationRecord;
      first_turn: { assistantMessage: ChatMessage; result: InvestigationResult | null } | null;
      mode: string;
    }>("/investigate", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getInvestigation(id: string | number) {
    if (USE_BACKEND) {
      try {
        const result = await backendClient.investigations.get(id);
        return {
          investigation: {
            id: parseInt(String(id)),
            messages: result.messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
            })),
            context: result.structured_case,
          } as InvestigationRecord,
        };
      } catch (error) {
        if (error instanceof backendClient.BackendError) {
          throw new ApiError(error.message, error.status);
        }
        throw error;
      }
    }
    return request<{ investigation: InvestigationRecord }>(`/investigation/${id}`);
  },

  async sendMessage(id: string | number, input: SendMessageInput) {
    if (USE_BACKEND) {
      try {
        const result = await backendClient.investigations.sendMessage(id, {
          message: input.message,
        });
        return {
          assistantMessage: {
            role: "assistant",
            content: result.assistant_message,
            timestamp: new Date().toISOString(),
          } as ChatMessage,
          result: null,
          mode: "external_backend" as const,
        };
      } catch (error) {
        if (error instanceof backendClient.BackendError) {
          throw new ApiError(error.message, error.status);
        }
        throw error;
      }
    }
    return request<EngineTurnResponse & { mode: string }>(`/investigation/${id}/message`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async listInvestigations() {
    if (USE_BACKEND) {
      try {
        const studentKey = await getStudentKey();
        const result = await backendClient.investigations.list(studentKey);
        return {
          investigations: result.investigations.map((inv) => ({
            id: parseInt(inv.investigation_id),
            messages: [],
            context: inv.structured_case,
            created_at: inv.created_at,
          })) as InvestigationListItem[],
        };
      } catch (error) {
        if (error instanceof backendClient.BackendError) {
          throw new ApiError(error.message, error.status);
        }
        throw error;
      }
    }
    return request<{ investigations: InvestigationListItem[] }>("/investigations");
  },

  async updateContext(
    id: string | number,
    updates: Record<string, string | number | null>,
    note?: string,
  ) {
    if (USE_BACKEND) {
      // Backend client doesn't expose this yet, fall back to internal
      return request<{
        studentMessage: ChatMessage;
        assistantMessage: ChatMessage;
        result: InvestigationResult | null;
        mode: string;
      }>(`/investigation/${id}/context`, {
        method: "POST",
        body: JSON.stringify({ updates, note }),
      });
    }
    return request<{
      studentMessage: ChatMessage;
      assistantMessage: ChatMessage;
      result: InvestigationResult | null;
      mode: string;
    }>(`/investigation/${id}/context`, {
      method: "POST",
      body: JSON.stringify({ updates, note }),
    });
  },

  async uploadEvidence(input: { investigationId: number; file: File; label?: string }) {
    if (USE_BACKEND) {
      try {
        const result = await backendClient.evidence.upload(input.investigationId, {
          file: input.file,
          label: input.label,
        });
        return {
          evidence_id: result.evidence_id,
          attachment: {
            id: result.evidence_id,
            name: input.label ?? input.file.name,
            type: input.file.type,
            size: input.file.size,
            url: "",
          } as ChatAttachment,
          turn: {
            assistantMessage: {
              role: "assistant",
              content: result.message ?? "Evidence uploaded successfully",
              timestamp: new Date().toISOString(),
            } as ChatMessage,
            result: null,
          },
        };
      } catch (error) {
        if (error instanceof backendClient.BackendError) {
          throw new ApiError(error.message, error.status);
        }
        throw error;
      }
    }
    const form = new FormData();
    form.append("investigation_id", String(input.investigationId));
    form.append("file", input.file);
    form.append("label", input.label?.trim() ? input.label.trim() : input.file.name);
    return request<{
      evidence_id: string;
      attachment: ChatAttachment;
      turn: { assistantMessage: ChatMessage; result: InvestigationResult | null };
    }>("/evidence", { method: "POST", body: form });
  },

  async submitPastedEvidence(input: {
    investigationId: number;
    label: string;
    text: string;
  }) {
    if (USE_BACKEND) {
      try {
        const result = await backendClient.evidence.upload(input.investigationId, {
          text: input.text,
          label: input.label,
        });
        return {
          evidence_id: result.evidence_id,
          attachment: {
            id: result.evidence_id,
            name: input.label,
            type: "text",
            size: input.text.length,
            url: "",
          } as ChatAttachment,
          turn: {
            assistantMessage: {
              role: "assistant",
              content: result.message ?? "Evidence submitted successfully",
              timestamp: new Date().toISOString(),
            } as ChatMessage,
            result: null,
          },
        };
      } catch (error) {
        if (error instanceof backendClient.BackendError) {
          throw new ApiError(error.message, error.status);
        }
        throw error;
      }
    }
    return request<{
      evidence_id: string;
      attachment: ChatAttachment;
      turn: { assistantMessage: ChatMessage; result: InvestigationResult | null };
    }>("/evidence", {
      method: "POST",
      body: JSON.stringify({
        investigation_id: input.investigationId,
        kind: "pasted_text",
        label: input.label,
        text: input.text,
      }),
    });
  },

  async submitLinkEvidence(input: { investigationId: number; url: string; label?: string }) {
    // Backend client doesn't expose this, fall back to internal
    return request<{
      evidence_id: string;
      attachment: ChatAttachment;
      turn: { assistantMessage: ChatMessage; result: InvestigationResult | null };
    }>("/evidence", {
      method: "POST",
      body: JSON.stringify({
        investigation_id: input.investigationId,
        kind: "link",
        url: input.url,
        label: input.label?.trim() ? input.label.trim() : undefined,
      }),
    });
  },

  async lookupUniversity(name: string) {
    if (USE_BACKEND) {
      try {
        return await backendClient.lookups.university(name);
      } catch (error) {
        if (error instanceof backendClient.BackendError) {
          throw new ApiError(error.message, error.status);
        }
        throw error;
      }
    }
    return request<Record<string, unknown>>(`/university/${encodeURIComponent(name)}`);
  },

  async lookupScholarship(name: string) {
    if (USE_BACKEND) {
      try {
        return await backendClient.lookups.scholarship(name);
      } catch (error) {
        if (error instanceof backendClient.BackendError) {
          throw new ApiError(error.message, error.status);
        }
        throw error;
      }
    }
    return request<Record<string, unknown>>(`/scholarship/${encodeURIComponent(name)}`);
  },

  async lookupAgent(name: string) {
    if (USE_BACKEND) {
      try {
        return await backendClient.lookups.agent(name);
      } catch (error) {
        if (error instanceof backendClient.BackendError) {
          throw new ApiError(error.message, error.status);
        }
        throw error;
      }
    }
    return request<Record<string, unknown>>(`/agent/${encodeURIComponent(name)}`);
  },

  async getProfile() {
    return request<{ profile: StudentProfile }>("/profile");
  },

  async signUp(input: {
    name: string;
    email: string;
    password: string;
    preferred_language?: Language;
    degree_level?: DegreeLevel | null;
    target_countries?: string[];
  }) {
    return request<{ account: { name: string | null; email: string | null } }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async signIn(input: { email: string; password: string }) {
    return request<{ account: { name: string | null; email: string | null } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async signOut() {
    return request<{ ok: boolean }>("/auth/logout", { method: "POST" });
  },

  async getCurrentAccount() {
    return request<{
      account: {
        name: string | null;
        email: string | null;
        preferred_language?: Language;
        degree_level?: DegreeLevel | null;
        target_countries?: string[];
        funding_preference?: string | null;
      } | null;
    }>("/auth/me");
  },

  async getEmergencyProtocols() {
    return request<{
      emergency: {
        title: string;
        subtitle: string;
        reassurance: { heading: string; body: string };
        sections: {
          id: string;
          title: string;
          icon: string;
          intro: string;
          actions: { title: string; detail: string }[];
          caution?: string;
        }[];
        contacts: { category: string; name: string; url: string; note: string }[];
        disclaimer: string;
        data_label: string;
      };
    }>("/emergency");
  },

  async saveProfile(profile: StudentProfile) {
    return request<{ profile: StudentProfile }>("/profile", {
      method: "POST",
      body: JSON.stringify(profile),
    });
  },

  async getDemoCase() {
    return request<{ demo: typeof demoCase; follow_ups: string[] }>("/demo");
  },

  async deleteInvestigation(id: string | number) {
    if (USE_BACKEND) {
      try {
        await backendClient.investigations.delete(id);
        return { success: true, id };
      } catch (error) {
        if (error instanceof backendClient.BackendError) {
          throw new ApiError(error.message, error.status);
        }
        throw error;
      }
    }
    return request<{ success: boolean; id: number }>(`/investigations/${id}`, {
      method: "DELETE",
    });
  },

  async analyzeInvestigation(id: string | number, message?: string) {
    return request<{
      success: boolean;
      investigation: InvestigationRecord;
      result: InvestigationResult | null;
      message: ChatMessage;
    }>(`/investigation/${id}/analyze`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },

  async submitReport(input: {
    agent_name: string;
    company_name?: string;
    complaint: string;
    rating?: number;
  }) {
    return request<{ success: boolean; message?: string; report?: unknown }>("/reports", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async getUniversities(query?: { q?: string; country?: string; level?: string }) {
    const sp = new URLSearchParams();
    if (query?.q) sp.set("q", query.q);
    if (query?.country) sp.set("country", query.country);
    if (query?.level) sp.set("level", query.level);
    const qs = sp.toString();
    return request<{ universities: unknown[]; total: number }>(
      `/universities${qs ? `?${qs}` : ""}`
    );
  },

  async getScholarships(query?: { q?: string; country?: string; level?: string }) {
    const sp = new URLSearchParams();
    if (query?.q) sp.set("q", query.q);
    if (query?.country) sp.set("country", query.country);
    if (query?.level) sp.set("level", query.level);
    const qs = sp.toString();
    return request<{ scholarships: unknown[]; total: number }>(
      `/scholarships${qs ? `?${qs}` : ""}`
    );
  },

  async getAgents(query?: { q?: string; city?: string; status?: string }) {
    const sp = new URLSearchParams();
    if (query?.q) sp.set("q", query.q);
    if (query?.city) sp.set("city", query.city);
    if (query?.status) sp.set("status", query.status);
    const qs = sp.toString();
    return request<{ agents: unknown[]; total: number }>(
      `/agents${qs ? `?${qs}` : ""}`
    );
  },

  async getSafetyGuides(query?: { q?: string; category?: string }) {
    const sp = new URLSearchParams();
    if (query?.q) sp.set("q", query.q);
    if (query?.category) sp.set("category", query.category);
    const qs = sp.toString();
    return request<{ guides: unknown[]; total: number }>(
      `/safety-guides${qs ? `?${qs}` : ""}`
    );
  },

  async checkSanctions(query: string, schema?: "Person" | "Company" | "Organization" | "LegalEntity") {
    if (USE_BACKEND) {
      try {
        return await backendClient.search.sanctions(query, schema);
      } catch (error) {
        if (error instanceof backendClient.BackendError) {
          throw new ApiError(error.message, error.status);
        }
        throw error;
      }
    }
    return request<SanctionsFinding>("/sanctions", {
      method: "POST",
      body: JSON.stringify({ query, schema }),
    });
  },

  async searchLiveIntelligence(query: string, category?: "agent" | "university" | "scholarship" | "general", country?: string) {
    if (USE_BACKEND) {
      try {
        return await backendClient.search.liveIntelligence(query, { category, country });
      } catch (error) {
        if (error instanceof backendClient.BackendError) {
          throw new ApiError(error.message, error.status);
        }
        throw error;
      }
    }
    return request<LiveIntelligenceFinding>("/search", {
      method: "POST",
      body: JSON.stringify({ query, category, country }),
    });
  },

  async queryKnowledge(query: string, topK?: number) {
    if (USE_BACKEND) {
      try {
        const result = await backendClient.search.knowledge(query, topK);
        return {
          query: result.query,
          citations: result.matches.map((m) => ({
            title: m.pattern,
            description: m.description,
            source: "fraud_patterns",
          })) as KnowledgeCitation[],
        };
      } catch (error) {
        if (error instanceof backendClient.BackendError) {
          throw new ApiError(error.message, error.status);
        }
        throw error;
      }
    }
    const sp = new URLSearchParams();
    sp.set("q", query);
    if (topK) sp.set("topK", String(topK));
    return request<{ query: string; citations: KnowledgeCitation[] }>(`/knowledge?${sp.toString()}`);
  },
};

export const demo = {
  case: demoCase,
  followUps: demoFollowUps,
  attachment: demoAttachmentFromCase,
};

export { starterPrompts } from "@/data/mock/demoCase";

export type ApiClient = typeof api;
