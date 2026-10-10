export interface UserSession {
  id: string;
  email: string;
  displayName?: string | null;
  credits: number;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  idea: string;
  startupIdea?: string;
  targetCustomer: string;
  oneLiner?: string;
  domain?: string;
  niche?: string;
  observedProblem?: string;
  biggestAssumption?: string;
  teamStrengths?: string[];
  constraints?: string[];
  createdVia?: string;
  availableData?: {
    surveyCount?: number;
    interviewCount?: number;
    keyFindings?: string;
    freeText?: string;
    [key: string]: unknown;
  };
  packId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CriterionLevel {
  CHUA_DAT: string;
  DAT: string;
  TOT: string;
}

export interface Criterion {
  id: string;
  name: string;
  description: string;
  levels: CriterionLevel;
}

export interface IntakeQuestion {
  id: string;
  question: string;
  type: "number" | "text" | "quote" | "single" | "multi";
  options?: string[];
  unknown_label?: string;
  if_unknown_task?: string;
  prompt_label?: string;
}

export interface Section {
  id: string;
  title: string;
  order: number;
  requirement: string;
  criteria: Criterion[];
  common_mistakes: string[];
  intake?: IntakeQuestion[];
}

export interface Pack {
  id: string;
  version: number;
  course: string;
  term: string;
  checkpoint: string;
  source: string;
  ends_at?: string;
  sections: Section[];
}

export interface GradedCriterion {
  id: string;
  name: string;
  level: "CHUA_DAT" | "DAT" | "TOT";
  reason: string;
  evidence_quote: string;
  why_important?: string;
  guiding_questions?: string[];
  missing?: string;
}

export interface WarningItem {
  type: "POSSIBLY_INVENTED_NUMBER" | "UNSOURCED_NUMBER" | "PLACEHOLDER" | "ASSUMPTION";
  message: string;
  quote?: string;
}

export interface FixActionInput {
  key: string;
  label: string;
  placeholder?: string;
}

export interface FixAction {
  id: string;
  criterion_id: string;
  type: "NEED_DATA" | "TASK" | "MARK_ASSUMPTIONS" | "FOCUS_REWRITE";
  label: string;
  explanation: string;
  why_important?: string;
  guiding_questions?: string[];
  inputs?: FixActionInput[];
}

export interface CompareDetail {
  criterion_id: string;
  criterion_name?: string;
  previous_level?: string;
  current_level: string;
  status: "improved" | "worse" | "same";
  reason: string;
  diff_snippet?: string;
}

export interface CompareWithParent {
  delta?: number;
  improved: string[];
  worse: string[];
  same: string[];
  details?: CompareDetail[];
  summary_reason?: string;
}

export interface GradeResult {
  grade_id: string;
  status: "ok" | "rejected";
  reject_reason: "TOO_SHORT" | "OUTPUT_IS_PROMPT" | "OFF_TOPIC" | null;
  section_id: string;
  off_topic: boolean;
  criteria: GradedCriterion[];
  warnings: WarningItem[];
  fix_actions: FixAction[];
  likely_questions: string[];
  compare_with_parent: CompareWithParent | null;
  output_text?: string;
  credits_left: number;
}
