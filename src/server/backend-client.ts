/**
 * Central client for communicating with the FastAPI backend.
 *
 * The backend provides the actual investigation engine, verification pipeline,
 * and risk scoring. This client handles all communication.
 *
 * When BACKEND_URL is set to the FastAPI backend URL, all requests go through
 * this client to the investigation engine.
 *
 * Environment variables:
 * - BACKEND_URL: The FastAPI backend URL (e.g., http://localhost:8000 or https://api.example.com)
 */

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ BACKEND_URL not configured. Set BACKEND_URL or NEXT_PUBLIC_BACKEND_URL environment variable.');
}

export class BackendError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'BackendError';
  }
}

async function backendFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!BACKEND_URL) {
    throw new BackendError(500, 'Backend URL not configured');
  }

  const url = `${BACKEND_URL}${path}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      let errorMessage = `Backend request failed: ${response.status}`;
      let errorDetails: unknown;

      try {
        const payload = (await response.json()) as {
          detail?: string | { msg?: string };
          error?: string;
          message?: string;
        };
        if (typeof payload.detail === 'string') {
          errorMessage = payload.detail;
        } else if (payload.detail && typeof payload.detail === 'object' && 'msg' in payload.detail && typeof payload.detail.msg === 'string') {
          errorMessage = payload.detail.msg;
        } else if (payload.error) {
          errorMessage = payload.error;
        } else if (payload.message) {
          errorMessage = payload.message;
        }
        errorDetails = payload;
      } catch {
        /* ignore JSON parse errors */
      }

      throw new BackendError(response.status, errorMessage, errorDetails);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof BackendError) throw error;
    throw new BackendError(
      500,
      `Backend connection failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
  }
}

/**
 * Investigation endpoints
 */
export const investigations = {
  /**
   * Start a new investigation with an initial message
   */
  async start(input: {
    initial_message: string;
    language?: string;
  }) {
    return backendFetch<{
      investigation_id: string;
      assistant_message: string;
      structured_case: Record<string, unknown>;
      ready_for_verification: boolean;
    }>('/investigations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Get an investigation by ID
   */
  async get(investigationId: string | number) {
    return backendFetch<{
      investigation_id: string;
      messages: Array<{
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
      }>;
      structured_case: Record<string, unknown>;
      evidence_items: Array<Record<string, unknown>>;
      results?: Record<string, unknown>;
    }>(`/investigations/${investigationId}`);
  },

  /**
   * List all investigations for the current user
   */
  async list(studentKey: string) {
    return backendFetch<{
      investigations: Array<{
        investigation_id: string;
        created_at: string;
        structured_case: Record<string, unknown>;
        last_message?: string;
      }>;
    }>(`/investigations?student_key=${encodeURIComponent(studentKey)}`);
  },

  /**
   * Send a message to continue the investigation chat
   */
  async sendMessage(investigationId: string | number, input: {
    message: string;
  }) {
    return backendFetch<{
      assistant_message: string;
      structured_case: Record<string, unknown>;
      ready_for_verification: boolean;
    }>(`/investigations/${investigationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Delete an investigation
   */
  async delete(investigationId: string | number) {
    return backendFetch<{ success: boolean; id: string | number }>(
      `/investigations/${investigationId}`,
      { method: 'DELETE' },
    );
  },
};

/**
 * Evidence endpoints
 */
export const evidence = {
  /**
   * Upload evidence (file or text) to an investigation
   */
  async upload(investigationId: string | number, input: {
    file?: File;
    text?: string;
    label?: string;
  }) {
    const formData = new FormData();
    formData.append('investigation_id', String(investigationId));

    if (input.file) {
      formData.append('file', input.file);
    } else if (input.text) {
      formData.append('text', input.text);
      formData.append('kind', 'pasted_text');
    }

    if (input.label) {
      formData.append('label', input.label);
    }

    const url = `${BACKEND_URL}/investigations/${investigationId}/evidence`;
    if (!BACKEND_URL) throw new BackendError(500, 'Backend URL not configured');

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        cache: 'no-store',
      });

      if (!response.ok) {
        let errorMessage = `Evidence upload failed: ${response.status}`;
        try {
          const payload = (await response.json()) as { detail?: string };
          if (payload.detail) errorMessage = payload.detail;
        } catch {
          /* ignore */
        }
        throw new BackendError(response.status, errorMessage);
      }

      return (await response.json()) as {
        evidence_id: string;
        extracted_data?: Record<string, unknown>;
        message?: string;
      };
    } catch (error) {
      if (error instanceof BackendError) throw error;
      throw new BackendError(
        500,
        `Evidence upload failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
  },
};

/**
 * Verification endpoints
 */
export const verification = {
  /**
   * Run the complete verification pipeline
   */
  async verify(investigationId: string | number) {
    return backendFetch<{
      risk_score: number;
      risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
      display_status: 'VERIFIED' | 'NEEDS_VERIFICATION' | 'SUSPICIOUS' | 'HIGH_RISK' | 'UNABLE_TO_VERIFY';
      evidence_records: Array<Record<string, unknown>>;
      recommendations: string[];
      safer_actions: string[];
    }>(`/investigations/${investigationId}/verify`, {
      method: 'POST',
    });
  },

  /**
   * Get verification results for an investigation
   */
  async getResults(investigationId: string | number) {
    return backendFetch<{
      investigation_id: string;
      risk_score: number;
      risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
      display_status: 'VERIFIED' | 'NEEDS_VERIFICATION' | 'SUSPICIOUS' | 'HIGH_RISK' | 'UNABLE_TO_VERIFY';
      university_result: Record<string, unknown>;
      agent_result: Record<string, unknown>;
      payment_result: Record<string, unknown>;
      document_result: Record<string, unknown>;
      fraud_signals: string[];
      recommendation: string;
      safer_actions: string[];
      manual_checks: string[];
    }>(`/investigations/${investigationId}/results`);
  },
};

/**
 * Lookup endpoints
 */
export const lookups = {
  /**
   * Look up a university
   */
  async university(name: string) {
    return backendFetch<Record<string, unknown>>(
      `/universities/${encodeURIComponent(name)}`,
    );
  },

  /**
   * Look up a scholarship
   */
  async scholarship(name: string) {
    return backendFetch<Record<string, unknown>>(
      `/scholarships/${encodeURIComponent(name)}`,
    );
  },

  /**
   * Look up a consultant/agent
   */
  async agent(name: string) {
    return backendFetch<Record<string, unknown>>(
      `/agents/${encodeURIComponent(name)}`,
    );
  },
};

/**
 * Search endpoints
 */
export const search = {
  /**
   * Perform live intelligence search
   */
  async liveIntelligence(query: string, options?: {
    category?: 'agent' | 'university' | 'scholarship' | 'general';
    country?: string;
  }) {
    return backendFetch<{
      results: Array<Record<string, unknown>>;
      source: string;
    }>('/search', {
      method: 'POST',
      body: JSON.stringify({ query, ...options }),
    });
  },

  /**
   * Search sanctions/entity screening
   */
  async sanctions(query: string, schema?: string) {
    return backendFetch<{
      entity_match: boolean;
      details?: Record<string, unknown>;
    }>('/sanctions', {
      method: 'POST',
      body: JSON.stringify({ query, schema }),
    });
  },

  /**
   * Query the fraud pattern knowledge base
   */
  async knowledge(query: string, topK?: number) {
    const sp = new URLSearchParams();
    sp.set('q', query);
    if (topK) sp.set('topK', String(topK));
    return backendFetch<{
      query: string;
      matches: Array<{
        pattern: string;
        description: string;
        risk_contribution: number;
      }>;
    }>(`/knowledge?${sp.toString()}`);
  },
};

/**
 * Health check
 */
export const health = {
  async check() {
    return backendFetch<{
      status: 'healthy' | 'degraded' | 'unhealthy';
      database: boolean;
      hipo_api: boolean;
      gemini_configured: boolean;
      groq_configured: boolean;
      tavily_configured: boolean;
      opensanctions_configured: boolean;
    }>('/health');
  },
};
