import { z } from "zod";

export const CriterionLevelEnum = z.enum(["CHUA_DAT", "DAT", "TOT"]);
export type CriterionLevel = z.infer<typeof CriterionLevelEnum>;

export const FixActionTypeEnum = z.enum([
  "NEED_DATA",
  "TASK",
  "MARK_ASSUMPTIONS",
  "FOCUS_REWRITE",
]);
export type FixActionType = z.infer<typeof FixActionTypeEnum>;

export const WarningTypeEnum = z.enum([
  "POSSIBLY_INVENTED_NUMBER",
  "UNSOURCED_NUMBER",
  "PLACEHOLDER",
  "ASSUMPTION",
]);
export type WarningType = z.infer<typeof WarningTypeEnum>;

export const FixActionInputSchema = z.object({
  key: z.string(),
  label: z.string(),
  placeholder: z.string().optional(),
});
export type FixActionInput = z.infer<typeof FixActionInputSchema>;

export const FixActionSchema = z.object({
  id: z.string(),
  criterion_id: z.string(),
  type: FixActionTypeEnum,
  label: z.string(),
  explanation: z.string(),
  inputs: z.array(FixActionInputSchema).optional(),
});
export type FixAction = z.infer<typeof FixActionSchema>;

export const WarningItemSchema = z.object({
  type: WarningTypeEnum,
  message: z.string(),
  quote: z.string().optional(),
});
export type WarningItem = z.infer<typeof WarningItemSchema>;

export const GradedCriterionSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: CriterionLevelEnum,
  reason: z.string(),
  evidence_quote: z.string(),
});
export type GradedCriterion = z.infer<typeof GradedCriterionSchema>;

export const CompareWithParentSchema = z.object({
  improved: z.array(z.string()),
  worse: z.array(z.string()),
  same: z.array(z.string()),
});
export type CompareWithParent = z.infer<typeof CompareWithParentSchema>;

// Schema matching Appendix B (GradeResult)
export const GradeResultSchema = z.object({
  grade_id: z.string(),
  status: z.enum(["ok", "rejected"]),
  reject_reason: z
    .enum(["TOO_SHORT", "OUTPUT_IS_PROMPT", "OFF_TOPIC"])
    .nullable(),
  section_id: z.string(),
  off_topic: z.boolean(),
  criteria: z.array(GradedCriterionSchema),
  warnings: z.array(WarningItemSchema),
  fix_actions: z.array(FixActionSchema),
  likely_questions: z.array(z.string()),
  compare_with_parent: CompareWithParentSchema.nullable(),
  credits_left: z.number(),
});
export type GradeResult = z.infer<typeof GradeResultSchema>;

// LLM Raw Response Schema (before merging code warnings, grade_id, and credits_left)
export const LlmGradeOutputSchema = z.object({
  off_topic: z.boolean().default(false),
  criteria: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      level: CriterionLevelEnum,
      reason: z.string(),
      evidence_quote: z.string().default(""),
    }),
  ),
  fix_actions: z
    .array(
      z.object({
        id: z.string(),
        criterion_id: z.string(),
        type: FixActionTypeEnum,
        label: z.string(),
        explanation: z.string(),
        inputs: z.array(FixActionInputSchema).optional(),
      }),
    )
    .max(3)
    .default([]),
  likely_questions: z.array(z.string()).max(3).default([]),
});
export type LlmGradeOutput = z.infer<typeof LlmGradeOutputSchema>;
