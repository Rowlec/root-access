import { z } from "zod";

export const currentStageOptions = [
  "No clear idea yet",
  "Have idea but not validated",
  "Doing market research",
  "Building business model",
  "Preparing pitch deck",
] as const;

export const deadlineUrgencyOptions = [
  "1-3 days",
  "1 week",
  "2 weeks+",
  "No deadline",
] as const;

export const goalFormSchema = z.object({
  currentStage: z.enum(currentStageOptions),
  startupIdea: z.string().trim().min(3),
  industry: z.string().trim().min(1),
  deadlineUrgency: z.enum(deadlineUrgencyOptions),
});

export type GoalFormValues = z.infer<typeof goalFormSchema>;
