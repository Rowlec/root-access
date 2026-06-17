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

export const availableToolOptions = [
  "ChatGPT",
  "Gemini",
  "Claude",
  "Canva AI",
  "Gamma",
  "Perplexity",
  "Lovable",
  "Other",
] as const;

export const availableToolSchema = z.enum(availableToolOptions);
export const availableToolsSchema = z.array(availableToolSchema).min(1);

export const goalFormSchema = z.object({
  currentStage: z.enum(currentStageOptions),
  startupIdea: z.string().trim().min(3),
  industry: z.string().trim().min(1),
  deadlineUrgency: z.enum(deadlineUrgencyOptions),
  availableTools: availableToolsSchema,
});

export type AvailableTool = z.infer<typeof availableToolSchema>;
export type GoalFormValues = z.infer<typeof goalFormSchema>;
