import { z } from "zod";

export const LevelSchema = z.object({
  CHUA_DAT: z.string().min(10),
  DAT: z.string().min(10),
  TOT: z.string().min(10),
});

export const AnchorSchema = z
  .object({
    CHUA_DAT: z.string(),
    DAT: z.string(),
    TOT: z.string(),
  })
  .optional();

export const CriterionSchema = z.object({
  id: z.string().regex(/^[a-z_]+$/),
  name: z.string(),
  description: z.string(),
  levels: LevelSchema,
  anchors: AnchorSchema,
});

export const IntakeQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum(["number", "text", "quote", "single", "multi"]),
  options: z.array(z.string()).default([]),
  unknown_label: z.string().optional(),
  if_unknown_task: z.string().optional(),
  prompt_label: z.string().optional(),
});

export const SectionSchema = z.object({
  id: z.string().regex(/^[a-z_]+$/),
  title: z.string(),
  order: z.number().int(),
  requirement: z.string().min(20),
  criteria: z.array(CriterionSchema).min(2).max(6),
  common_mistakes: z.array(z.string()).max(8),
  prompt_template: z.string().optional(), // bỏ trống = dùng khung chung ở Mục 7.1
  fix_hints: z.array(z.string()).optional(),
  intake: z.array(IntakeQuestionSchema).optional(),
});

export const PackSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  course: z.string(),
  term: z.string(),
  checkpoint: z.string(),
  source: z.string().min(10), // bắt buộc ghi nguồn
  ends_at: z.string().optional(),
  sections: z.array(SectionSchema).min(1),
});

export type Level = z.infer<typeof LevelSchema>;
export type Anchor = z.infer<typeof AnchorSchema>;
export type Criterion = z.infer<typeof CriterionSchema>;
export type IntakeQuestion = z.infer<typeof IntakeQuestionSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Pack = z.infer<typeof PackSchema>;
