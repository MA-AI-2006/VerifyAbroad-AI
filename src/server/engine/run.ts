import type { ChatMessage, DegreeLevel, FundingType, InvestigationResult, Language } from "@/types";
import { extractFacts } from "@/server/engine/extract";
import { messagesToCorpus, runAssessment } from "@/server/engine/assess";
import { detectAndAnswerQuestion } from "@/server/engine/questionAnswer";
import { t } from "@/server/engine/phrases";
import {
  createInitialInvestigationState,
  detectCorrections,
  detectFrustration,
  detectUserNegations,
  getFieldForTopic,
  type PersistentInvestigationState,
} from "@/server/engine/state";
import { maybeEnrichReply } from "@/server/llm";
import { loadVerificationData } from "@/server/repositories/verification";
import { screenAgainstSanctions } from "@/server/services/opensanctions";
import { investigateEntityWithTavily } from "@/server/services/tavily";
import { searchWithGeminiGrounding } from "@/server/services/geminiSearch";
import { queryKnowledgeBase } from "@/server/services/knowledgeBase";
import {
  appendMessage,
  getInvestigation,
  getInvestigationRow,
  updateInvestigation,
} from "@/server/repositories/investigations";

export interface TurnInput {
  investigationId: number;
  studentText: string;
  attachments?: ChatMessage["attachments"];
  explicitDegree?: DegreeLevel | null;
  explicitFunding?: FundingType | null;
}

export interface TurnOutput {
  assistantMessage: ChatMessage;
  result: InvestigationResult | null;
}

export async function runInvestigationTurn(input: TurnInput): Promise<TurnOutput> {
  const record = await getInvestigation(input.investigationId);
  if (!record) throw new Error("Investigation not found");

  const priorMessages = record.messages;

  const studentText = input.studentText.trim();
  const evidenceNotes = (input.attachments ?? [])
    .map((attachment) => `${attachment.label} ${attachment.note ?? ""}`)
    .join("\n");

  const corpus = [
    messagesToCorpus(priorMessages),
    studentText,
    evidenceNotes,
    [
      record.context.university,
      record.context.program,
      record.context.scholarship,
      record.context.agent,
      record.context.country,
      record.context.degree_level,
    ]
      .filter(Boolean)
      .join(" "),
  ]
    .filter(Boolean)
    .join("\n");

  const facts = extractFacts(corpus);
  const latestFacts = studentText ? extractFacts(studentText) : null;
  const language: Language =
    latestFacts && latestFacts.language !== "english" ? latestFacts.language : facts.language;

  // Retrieve or initialize state
  const recordRow = await getInvestigationRow(input.investigationId);
  const rawState = (recordRow?.investigationState ?? record.latest_result?.investigation_state) as
    | PersistentInvestigationState
    | undefined;

  const state: PersistentInvestigationState = rawState
    ? {
        stage: rawState.stage ?? "INTAKE",
        turnCount: rawState.turnCount ?? 0,
        fields: { ...rawState.fields },
        questionHistory: [...(rawState.questionHistory ?? [])],
        activeQuestionTopic: rawState.activeQuestionTopic ?? null,
        userCorrections: [...(rawState.userCorrections ?? [])],
        frustrationDetected: Boolean(rawState.frustrationDetected),
        staleVerification: Boolean(rawState.staleVerification),
      }
    : createInitialInvestigationState();

  state.turnCount += 1;

  // 1. Frustration detection
  const hasFrustration = detectFrustration(studentText);
  let frustrationApology = false;
  if (hasFrustration) {
    state.frustrationDetected = true;
    frustrationApology = true;
  }

  // 2. User negations detection (explicitly stating no agent, no scholarship, etc.)
  const negations = detectUserNegations(studentText);
  if (negations.noAgent) {
    state.fields.agent = { value: null, status: "user_stated_none", lastUpdatedTurn: state.turnCount };
    if (state.activeQuestionTopic === "agent") state.activeQuestionTopic = null;
  }
  if (negations.noScholarship) {
    state.fields.scholarship = { value: null, status: "user_stated_none", lastUpdatedTurn: state.turnCount };
    if (state.activeQuestionTopic === "scholarship") state.activeQuestionTopic = null;
  }
  if (negations.noUniversity) {
    state.fields.university = { value: null, status: "user_stated_none", lastUpdatedTurn: state.turnCount };
    if (state.activeQuestionTopic === "university") state.activeQuestionTopic = null;
  }
  if (negations.unknownValue && state.activeQuestionTopic) {
    const topicField = getFieldForTopic(state.activeQuestionTopic);
    if (topicField && topicField !== "hasEvidence") {
      const field = state.fields[topicField] as import("@/server/engine/state").FieldState<any>;
      if (field) {
        field.status = "unknown_by_user";
        field.lastUpdatedTurn = state.turnCount;
      }
    }
    state.activeQuestionTopic = null;
  }

  // 3. User corrections detection
  const corrections = detectCorrections(studentText, state);
  let correctionNote: string | null = null;
  if (corrections.length > 0) {
    state.userCorrections.push(...corrections);
    correctionNote = corrections.map((c) => `${c.field}: "${c.newValue}"`).join(", ");
    for (const c of corrections) {
      if (c.field === "university") {
        state.fields.university = { value: String(c.newValue), status: "known", lastUpdatedTurn: state.turnCount };
      } else if (c.field === "country") {
        state.fields.country = { value: String(c.newValue), status: "known", lastUpdatedTurn: state.turnCount };
      } else if (c.field === "agent") {
        state.fields.agent = { value: String(c.newValue), status: "known", lastUpdatedTurn: state.turnCount };
      } else if (c.field === "scholarship") {
        state.fields.scholarship = { value: String(c.newValue), status: "known", lastUpdatedTurn: state.turnCount };
      } else if (c.field === "program") {
        state.fields.program = { value: String(c.newValue), status: "known", lastUpdatedTurn: state.turnCount };
      }
    }
  }

  // 4. Update known fields from the latest turn
  if (latestFacts) {
    if (latestFacts.country && state.fields.country.status !== "user_stated_none") {
      state.fields.country = { value: latestFacts.country, status: "known", lastUpdatedTurn: state.turnCount };
    }
    if (latestFacts.degreeLevel) {
      state.fields.degreeLevel = { value: latestFacts.degreeLevel, status: "known", lastUpdatedTurn: state.turnCount };
    }
    if (latestFacts.universityHint && !negations.noUniversity && state.fields.university.status !== "user_stated_none") {
      state.fields.university = { value: latestFacts.universityHint, status: "known", lastUpdatedTurn: state.turnCount };
    }
    if (latestFacts.agentHint && !negations.noAgent && state.fields.agent.status !== "user_stated_none") {
      state.fields.agent = { value: latestFacts.agentHint, status: "known", lastUpdatedTurn: state.turnCount };
    }
    if (latestFacts.scholarshipHint && !negations.noScholarship && state.fields.scholarship.status !== "user_stated_none") {
      state.fields.scholarship = { value: latestFacts.scholarshipHint, status: "known", lastUpdatedTurn: state.turnCount };
    }
    if (latestFacts.paymentAmountPkr !== null) {
      state.fields.paymentAmountPkr = {
        value: latestFacts.paymentAmountPkr,
        status: "known",
        lastUpdatedTurn: state.turnCount,
      };
      if (latestFacts.paymentAmountDisplay) {
        state.fields.paymentAmountDisplay = {
          value: latestFacts.paymentAmountDisplay,
          status: "known",
          lastUpdatedTurn: state.turnCount,
        };
      }
    }
    if (latestFacts.paymentPurpose) {
      state.fields.paymentPurpose = { value: latestFacts.paymentPurpose, status: "known", lastUpdatedTurn: state.turnCount };
    }
    if (latestFacts.recipientType !== "unknown") {
      state.fields.recipientType = { value: latestFacts.recipientType, status: "known", lastUpdatedTurn: state.turnCount };
    }
    if ((input.attachments?.length ?? 0) > 0) {
      state.fields.hasEvidence = true;
    }
  }

  // 5. If user answered the currently active question, mark it answered
  if (state.activeQuestionTopic) {
    const topicField = getFieldForTopic(state.activeQuestionTopic);
    const field =
      topicField && topicField !== "hasEvidence"
        ? (state.fields[topicField] as import("@/server/engine/state").FieldState<any>)
        : null;
    if (field && (field.status === "known" || field.status === "user_stated_none" || field.status === "unknown_by_user")) {
      for (const q of state.questionHistory) {
        if (q.topic === state.activeQuestionTopic && q.status === "pending") {
          q.status = "answered";
        }
      }
      state.activeQuestionTopic = null;
    }
  }

  const data = await loadVerificationData();

  const evidenceCount =
    (input.attachments?.length ?? 0) +
    priorMessages.reduce((total, message) => total + (message.attachments?.length ?? 0), 0);

  const qAns = detectAndAnswerQuestion(studentText, language);
  const studentQuestionAnswer = qAns.hasQuestion ? qAns.answer : null;

  const assessment = runAssessment({
    facts,
    data,
    corpus,
    investigationId: record.id,
    language,
    explicitDegree: input.explicitDegree ?? record.context.degree_level ?? null,
    explicitFunding: input.explicitFunding ?? record.context.funding_type ?? null,
    evidenceCount,
    state,
    frustrationApology,
    correctionNote,
    studentQuestionAnswer,
  });

  // 1. Knowledge Base RAG retrieval
  try {
    const citations = await queryKnowledgeBase(corpus, 3);
    if (citations.length > 0) {
      assessment.result.knowledge_citations = citations;
    }
  } catch (err) {
    console.warn("Knowledge base query failed:", err);
  }

  // 2. OpenSanctions screening on consultant / agent or company
  const agentTarget = assessment.extracted.agent ?? record.context.agent ?? facts.agentHint;
  if (agentTarget) {
    try {
      const sanctions = await screenAgainstSanctions(agentTarget);
      assessment.result.sanctions_screening = sanctions;
      if (sanctions.match_count > 0) {
        assessment.result.overall_risk = "high";
        assessment.result.risk_signals.unshift({
          category: "agent",
          severity: "high",
          title: "Regulatory Sanctions or Enforcement Match",
          explanation: sanctions.summary,
        });
      }
    } catch (err) {
      console.warn("Sanctions screening failed:", err);
    }
  }

  // 3. Live Web Research (Tavily & Gemini Search Grounding)
  const targetEntity =
    agentTarget ||
    assessment.extracted.university ||
    record.context.university ||
    assessment.extracted.scholarship;

  if (targetEntity) {
    try {
      const category = agentTarget ? "agent" : assessment.extracted.university ? "university" : "general";
      const liveIntel = await investigateEntityWithTavily(
        targetEntity,
        category,
        assessment.extracted.country ?? record.context.country,
      );

      if (liveIntel.results.length > 0) {
        assessment.result.live_intelligence = liveIntel;
      } else if (process.env.GEMINI_API_KEY) {
        const geminiGrounding = await searchWithGeminiGrounding(
          `${targetEntity} ${assessment.extracted.country ?? ""} study abroad verification`,
        );
        if (geminiGrounding.results.length > 0) {
          assessment.result.live_intelligence = geminiGrounding;
        }
      }
    } catch (err) {
      console.warn("Live web intelligence search failed:", err);
    }
  }

  const systemGoal = [
    "You are RaastaAI, a calm, respectful, objective, and supportive study-abroad safety investigator for Pakistani students.",
    "CRITICAL CONVERSATIONAL RULES:",
    "1. NEVER argue, scold, provoke, or ragebait the student under any circumstance.",
    "2. NEVER repeat a question or ask for information the student already stated, negated, or clarified.",
    "3. ASK AT MOST ONE SINGLE QUESTION if clarification is needed. If the draft contains no question, do NOT introduce any question.",
    "4. If the student expressed frustration or corrected a detail, apologize briefly and calmly, acknowledge their answer, and proceed with the assessment.",
    "5. Keep the exact same language as the student (English, Urdu, or Roman Urdu).",
    "6. Do not contradict the structured investigation facts, warning signals, verdicts, or risk level.",
    "7. ANSWER THE STUDENT'S QUESTION: If the student asked any question, query, or asked for advice (e.g. visa guarantees, scholarship costs/fees, direct portals, IELTS, embassy slots, or consultant trustworthiness), provide a direct, clear, and reassuring answer in the opening portion of the reply before presenting the structured findings.",
  ].join(" ");

  const replyText = await maybeEnrichReply({
    systemGoal,
    studentText,
    draft: assessment.replyText,
    structured: assessment.result,
  });

  await appendMessage({
    investigationId: input.investigationId,
    role: "student",
    text: studentText,
    attachments: input.attachments ?? [],
  });

  const assistantRow = await appendMessage({
    investigationId: input.investigationId,
    role: "assistant",
    text: replyText,
    result: assessment.phase === "assessed" ? assessment.result : null,
  });

  const titleParts = [
    assessment.extracted.country ?? record.context.country,
    assessment.extracted.degreeLevel ?? record.context.degree_level,
    assessment.extracted.program ?? record.context.program,
  ]
    .filter(Boolean)
    .join(" — ");

  const askedQuestionsList = (state.questionHistory ?? []).map((q) => q.questionText);

  await updateInvestigation(input.investigationId, {
    language,
    status: assessment.phase,
    country: assessment.extracted.country ?? record.context.country ?? null,
    degreeLevel: assessment.extracted.degreeLevel ?? record.context.degree_level ?? null,
    programName: assessment.extracted.program ?? record.context.program ?? null,
    universityName: assessment.extracted.university ?? record.context.university ?? null,
    scholarshipName: assessment.extracted.scholarship ?? record.context.scholarship ?? null,
    agentName: assessment.extracted.agent ?? record.context.agent ?? null,
    fundingType: assessment.extracted.fundingType ?? record.context.funding_type ?? null,
    overallRisk: assessment.result.overall_risk,
    summary: assessment.result.summary,
    latestResult: assessment.result,
    askedQuestions: askedQuestionsList,
    investigationState: state,
    ...(titleParts.length > 0 ? { title: titleParts } : {}),
  });

  return {
    assistantMessage: {
      id: String(assistantRow.id),
      role: "assistant",
      text: replyText,
      created_at: assistantRow.createdAt.toISOString(),
      attachments: [],
      result: assessment.phase === "assessed" ? assessment.result : null,
      still_need: assessment.stillNeed,
    },
    result: assessment.phase === "assessed" ? assessment.result : null,
  };
}

export async function startNewInvestigation(input: {
  studentKey: string;
  language: Language;
  firstMessage?: string;
  attachments?: ChatMessage["attachments"];
}) {
  const { createInvestigation, getOrCreateStudent } = await import(
    "@/server/repositories/investigations"
  );
  await getOrCreateStudent(input.studentKey, {
    name: "",
    preferred_language: input.language,
    degree_level: null,
    target_countries: [],
    funding_preference: null,
  });
  const row = await createInvestigation({
    studentKey: input.studentKey,
    language: input.language,
    context: {},
  });

  const welcome = t("welcome", input.language);
  const welcomeRow = await appendMessage({
    investigationId: row.id,
    role: "assistant",
    text: welcome,
  });

  if (input.firstMessage && input.firstMessage.trim().length > 0) {
    const turn = await runInvestigationTurn({
      investigationId: row.id,
      studentText: input.firstMessage,
      attachments: input.attachments ?? [],
    });
    return {
      investigationId: row.id,
      welcomeMessage: {
        id: String(welcomeRow.id),
        role: "assistant" as const,
        text: welcome,
        created_at: welcomeRow.createdAt.toISOString(),
        attachments: [],
      },
      turn,
    };
  }

  return {
    investigationId: row.id,
    welcomeMessage: {
      id: String(welcomeRow.id),
      role: "assistant" as const,
      text: welcome,
      created_at: welcomeRow.createdAt.toISOString(),
      attachments: [],
    },
    turn: null,
  };
}

export type ContextField =
  | "country"
  | "degree_level"
  | "university"
  | "program"
  | "scholarship"
  | "agent"
  | "funding_type"
  | "payment_amount_pkr";

const FIELD_LABELS: Record<ContextField, string> = {
  country: "Country",
  degree_level: "Degree level",
  university: "University",
  program: "Program",
  scholarship: "Scholarship",
  agent: "Consultant",
  funding_type: "Funding",
  payment_amount_pkr: "Payment (PKR)",
};

/**
 * Student-driven profile update. The student can add, correct or remove any
 * detail the assistant extracted — extraction is never treated as final.
 * The investigation is then re-run with their values taking priority.
 */
export async function runContextUpdate(input: {
  investigationId: number;
  updates: Partial<Record<ContextField, string | number | null>>;
  note?: string;
}) {
  const record = await getInvestigation(input.investigationId);
  if (!record) throw new Error("Investigation not found");

  const merged: Record<ContextField, string | number | null> = {
    country: record.context.country ?? null,
    degree_level: record.context.degree_level ?? null,
    university: record.context.university ?? null,
    program: record.context.program ?? null,
    scholarship: record.context.scholarship ?? null,
    agent: record.context.agent ?? null,
    funding_type: record.context.funding_type ?? null,
    payment_amount_pkr: null,
  };
  for (const [key, value] of Object.entries(input.updates)) {
    merged[key as ContextField] = value ?? null;
  }

  const paymentValue =
    merged.payment_amount_pkr !== null && merged.payment_amount_pkr !== undefined
      ? `${merged.payment_amount_pkr} PKR`
      : null;

  const matchText = [
    merged.university,
    merged.scholarship,
    merged.agent,
    merged.program,
    merged.country,
    merged.degree_level,
    paymentValue,
  ]
    .filter((value) => value !== null && value !== undefined && String(value).trim().length > 0)
    .map((value) => String(value))
    .join("\n");

  const corpus = [
    messagesToCorpus(record.messages.filter((message) => message.role === "student")),
    matchText,
  ]
    .filter(Boolean)
    .join("\n");

  const facts = extractFacts(corpus);
  const language = record.language;
  const data = await loadVerificationData();

  const evidenceCount = record.messages.reduce(
    (total, message) => total + (message.attachments?.length ?? 0),
    0,
  );

  const assessment = runAssessment({
    facts,
    data,
    corpus,
    matchText,
    investigationId: record.id,
    language,
    explicitDegree: (merged.degree_level as DegreeLevel | null) ?? null,
    explicitFunding: (merged.funding_type as FundingType | null) ?? null,
    evidenceCount,
    suppliedNames: {
      university: (merged.university as string | null) ?? null,
      scholarship: (merged.scholarship as string | null) ?? null,
      agent: (merged.agent as string | null) ?? null,
      program: (merged.program as string | null) ?? null,
    },
  });

  const changed = Object.entries(input.updates)
    .filter(([key]) => key in FIELD_LABELS)
    .map(([key, value]) => {
      const label = FIELD_LABELS[key as ContextField];
      return value === null || value === "" ? `${label} removed` : `${label}: ${value}`;
    });

  const studentText = `[Investigation profile updated] ${changed.join(" · ")}${
    input.note ? ` — ${input.note}` : ""
  }`;

  const studentRow = await appendMessage({
    investigationId: input.investigationId,
    role: "student",
    text: studentText,
  });

  const replyText = await maybeEnrichReply({
    systemGoal:
      "You are RaastaAI, a study-abroad safety investigator for Pakistani students. The student just updated a detail in their investigation profile. Re-run the assessment and tell them concisely what changed, what is now verified, what still needs verification, and one safe next step. Never accuse anyone of fraud. Reply in the student's language.",
    studentText,
    draft: assessment.replyText,
    structured: assessment.result,
  });

  const assistantRow = await appendMessage({
    investigationId: input.investigationId,
    role: "assistant",
    text: replyText,
    result: assessment.phase === "assessed" ? assessment.result : null,
  });

  await updateInvestigation(input.investigationId, {
    country: (merged.country as string | null) ?? null,
    degreeLevel: (merged.degree_level as string | null) ?? null,
    programName: (merged.program as string | null) ?? null,
    universityName: (merged.university as string | null) ?? null,
    scholarshipName: (merged.scholarship as string | null) ?? null,
    agentName: (merged.agent as string | null) ?? null,
    fundingType: (merged.funding_type as string | null) ?? null,
    status: assessment.phase,
    overallRisk: assessment.result.overall_risk,
    summary: assessment.result.summary,
    latestResult: assessment.result,
  });

  return {
    studentMessage: {
      id: String(studentRow.id),
      role: "student" as const,
      text: studentText,
      created_at: studentRow.createdAt.toISOString(),
      attachments: [],
    },
    assistantMessage: {
      id: String(assistantRow.id),
      role: "assistant" as const,
      text: replyText,
      created_at: assistantRow.createdAt.toISOString(),
      attachments: [],
      result: assessment.phase === "assessed" ? assessment.result : null,
      still_need: assessment.stillNeed,
    },
    result: assessment.phase === "assessed" ? assessment.result : null,
  };
}

export async function loadInvestigationPayload(id: number) {
  const row = await getInvestigationRow(id);
  if (!row) return null;
  return getInvestigation(id);
}
