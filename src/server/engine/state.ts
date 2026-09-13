import type { DegreeLevel, FundingType, Language } from "@/types";

export type FieldStatus =
  | "unasked"
  | "asked"
  | "known"
  | "extracted"
  | "user_confirmed"
  | "user_stated_none"
  | "unknown_by_user"
  | "declined";

export interface FieldState<T = string | number | null> {
  value: T;
  status: FieldStatus;
  lastUpdatedTurn: number;
}

export type QuestionTopic =
  | "university"
  | "country"
  | "degree_level"
  | "program"
  | "scholarship"
  | "agent"
  | "payment_purpose"
  | "payment_amount"
  | "recipient_type"
  | "evidence";

export function getFieldForTopic(
  topic: QuestionTopic,
): keyof PersistentInvestigationState["fields"] | null {
  switch (topic) {
    case "university":
      return "university";
    case "country":
      return "country";
    case "degree_level":
      return "degreeLevel";
    case "program":
      return "program";
    case "scholarship":
      return "scholarship";
    case "agent":
      return "agent";
    case "payment_purpose":
      return "paymentPurpose";
    case "payment_amount":
      return "paymentAmountPkr";
    case "recipient_type":
      return "recipientType";
    default:
      return null;
  }
}

export interface AskedQuestionRecord {
  topic: QuestionTopic;
  questionText: string;
  askedAtTurn: number;
  status: "pending" | "answered" | "declined" | "bypassed";
}

export interface UserCorrection {
  field: string;
  oldValue: string | number | null;
  newValue: string | number | null;
  turn: number;
}

export type InvestigationStage =
  | "INTAKE"
  | "INVESTIGATION"
  | "VERIFICATION"
  | "ADVISORY";

export interface PersistentInvestigationState {
  stage: InvestigationStage;
  turnCount: number;
  fields: {
    country: FieldState<string | null>;
    degreeLevel: FieldState<DegreeLevel | null>;
    university: FieldState<string | null>;
    program: FieldState<string | null>;
    scholarship: FieldState<string | null>;
    agent: FieldState<string | null>;
    fundingType: FieldState<FundingType | null>;
    paymentAmountPkr: FieldState<number | null>;
    paymentAmountDisplay: FieldState<string | null>;
    paymentPurpose: FieldState<string | null>;
    recipientType: FieldState<"personal" | "institutional" | "unknown">;
    hasEvidence: boolean;
  };
  questionHistory: AskedQuestionRecord[];
  activeQuestionTopic: QuestionTopic | null;
  frustrationDetected: boolean;
  userCorrections: UserCorrection[];
  staleVerification: boolean;
}

export function createInitialInvestigationState(): PersistentInvestigationState {
  return {
    stage: "INTAKE",
    turnCount: 0,
    fields: {
      country: { value: null, status: "unasked", lastUpdatedTurn: 0 },
      degreeLevel: { value: null, status: "unasked", lastUpdatedTurn: 0 },
      university: { value: null, status: "unasked", lastUpdatedTurn: 0 },
      program: { value: null, status: "unasked", lastUpdatedTurn: 0 },
      scholarship: { value: null, status: "unasked", lastUpdatedTurn: 0 },
      agent: { value: null, status: "unasked", lastUpdatedTurn: 0 },
      fundingType: { value: null, status: "unasked", lastUpdatedTurn: 0 },
      paymentAmountPkr: { value: null, status: "unasked", lastUpdatedTurn: 0 },
      paymentAmountDisplay: { value: null, status: "unasked", lastUpdatedTurn: 0 },
      paymentPurpose: { value: null, status: "unasked", lastUpdatedTurn: 0 },
      recipientType: { value: "unknown", status: "unasked", lastUpdatedTurn: 0 },
      hasEvidence: false,
    },
    questionHistory: [],
    activeQuestionTopic: null,
    frustrationDetected: false,
    userCorrections: [],
    staleVerification: false,
  };
}

/**
 * Frustration or circular conversation detection.
 * Identifies when the user feels the assistant is repeating, not listening, or pushing.
 */
const FRUSTRATION_PATTERNS = [
  /already told (you|u)/i,
  /already (said|mentioned|explained|answered)/i,
  /stop asking/i,
  /why (are you|do you keep) asking/i,
  /you asked (that|this) (already|before)/i,
  /stop repeating/i,
  /you keep repeating/i,
  /listen to me/i,
  /did you (even )?(read|hear)/i,
  /just (tell|answer|verify)/i,
  /don'?t ask again/i,
  /i just told you/i,
  /wahi sawal/i,
  /baar baar/i,
  /bar bar/i,
  /pehle hi bataya/i,
  /pehle bata chuka/i,
  /kitni baar/i,
  /mat poocho/i,
  /mat pucho/i,
  /dimagh mat khao/i,
  /ek hi baat/i,
  /jawab do/i,
  /are you dumb/i,
  /are you listening/i,
];

export function detectFrustration(text: string): boolean {
  return FRUSTRATION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Detects explicit negative assertions (e.g. "no agent", "no scholarship", "I don't know")
 */
export function detectUserNegations(text: string): {
  noAgent: boolean;
  noScholarship: boolean;
  noUniversity: boolean;
  unknownValue: boolean;
} {
  const norm = text.toLowerCase();

  const noAgent =
    /(no|without|dont have|not having|don't have|zero|none|no any)\s*(an?\s*)?(agent|consultant|agency|counselor)|(agent|consultant)\s*(nahi|nahin|not|nai|none)|(khud|self|direct)\s*(hi\s*)?apply/i.test(
      norm,
    );

  const noScholarship =
    /(no|without|dont have|not having|don't have|no any)\s*(scholarship|funding|grant)|(scholarship|funding)\s*(nahi|nahin|not|nai|none)|self\s*funded/i.test(
      norm,
    );

  const noUniversity =
    /(haven'?t (decided|picked|chosen)|not sure about university|no university (yet|selected)|university (nahi|nahin|pata nahi))/i.test(
      norm,
    );

  const unknownValue =
    /(i don'?t know|not sure|dont know|no idea|pata nahi|maloom nahi|patta nahi|nahi pata|nahin pata|haven'?t decided|cannot say|can't say|unclear)/i.test(
      norm,
    );

  return { noAgent, noScholarship, noUniversity, unknownValue };
}

/**
 * Detects if the user is explicitly correcting a previously extracted fact.
 */
export function detectCorrections(
  text: string,
  state: PersistentInvestigationState,
): UserCorrection[] {
  const norm = text.toLowerCase();
  const corrections: UserCorrection[] = [];

  // Correction indicators: "not X, it's Y", "actually X", "no, X", "correction: X"
  const isCorrectionIntent =
    /(^|\s)(not|actually|instead of|correction|wrong|maine kaha|i said|maine bola|galat|nahi|nahin|nahi hai)(\s|$)/i.test(
      norm,
    );

  if (!isCorrectionIntent) return corrections;

  // University correction check
  if (state.fields.university.value) {
    const uniRegex = /(?:not|instead of)\s+([a-zA-Z\s]+?)(?:,|but|it is|its|\s+is|\s+hai)\s+([a-zA-Z0-9\s]+)/i;
    const match = text.match(uniRegex);
    if (match && match[2]) {
      corrections.push({
        field: "university",
        oldValue: state.fields.university.value,
        newValue: match[2].trim(),
        turn: state.turnCount + 1,
      });
    }
  }

  return corrections;
}

/**
 * Checks if asking this question topic would result in a repetitive or loop question.
 */
export function isQuestionRedundant(
  topic: QuestionTopic,
  state: PersistentInvestigationState,
): boolean {
  // 1. If the field is already known or confirmed, never ask
  switch (topic) {
    case "country":
      if (
        state.fields.country.value ||
        state.fields.country.status === "user_stated_none" ||
        state.fields.country.status === "unknown_by_user"
      )
        return true;
      break;
    case "degree_level":
      if (
        state.fields.degreeLevel.value ||
        state.fields.degreeLevel.status === "unknown_by_user"
      )
        return true;
      break;
    case "university":
      if (
        state.fields.university.value ||
        state.fields.university.status === "user_stated_none" ||
        state.fields.university.status === "unknown_by_user"
      )
        return true;
      break;
    case "program":
      if (
        state.fields.program.value ||
        state.fields.program.status === "user_stated_none" ||
        state.fields.program.status === "unknown_by_user"
      )
        return true;
      break;
    case "scholarship":
      if (
        state.fields.scholarship.value ||
        state.fields.scholarship.status === "user_stated_none" ||
        state.fields.scholarship.status === "unknown_by_user"
      )
        return true;
      break;
    case "agent":
      if (
        state.fields.agent.value ||
        state.fields.agent.status === "user_stated_none" ||
        state.fields.agent.status === "unknown_by_user"
      )
        return true;
      break;
    case "payment_purpose":
      if (
        state.fields.paymentPurpose.value ||
        state.fields.paymentPurpose.status === "user_stated_none" ||
        state.fields.paymentPurpose.status === "unknown_by_user"
      )
        return true;
      break;
    case "recipient_type":
      if (
        state.fields.recipientType.value !== "unknown" ||
        state.fields.recipientType.status === "unknown_by_user"
      )
        return true;
      break;
    case "evidence":
      if (state.fields.hasEvidence) return true;
      break;
  }

  // 2. If this topic was ALREADY asked in any prior turn, NEVER ask it again!
  const alreadyAsked = state.questionHistory.some(
    (q) => q.topic === topic && q.status !== "declined",
  );
  if (alreadyAsked) return true;

  return false;
}
