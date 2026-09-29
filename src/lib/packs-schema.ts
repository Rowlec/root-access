import { z } from "zod";

export const LevelSchema = z.object({
  CHUA_DAT: z.string().min(10),
  DAT: z.string().min(10),
  TOT: z.string().min(10),
});

export const CriterionSchema = z.object({
  id: z.string().regex(/^[a-z_]+$/),
  name: z.string(),
  description: z.string(),
  levels: LevelSchema,
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
});

export const PackSchema = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  course: z.string(),
  term: z.string(),
  checkpoint: z.string(),
  source: z.string().min(10), // bắt buộc ghi nguồn
  sections: z.array(SectionSchema).min(1),
});

export type Level = z.infer<typeof LevelSchema>;
export type Criterion = z.infer<typeof CriterionSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Pack = z.infer<typeof PackSchema>;
