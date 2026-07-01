import { z } from "zod";

export const currentStageOptions = [
  "No clear idea yet",
  "Have idea but not validated",
  "Doing market research",
  "Building business model",
  "Planning MVP",
  "Preparing pitch deck",
] as const;

export const deadlineUrgencyOptions = [
  "1-3 days",
  "1 week",
  "2 weeks+",
  "No deadline",
] as const;

export const workflowModeOptions = ["quick", "deep"] as const;

export const availableToolOptions = [
  "ChatGPT",
  "Gemini",
] as const;

export const availableToolSchema = z.enum(availableToolOptions);
export const availableToolsSchema = z.array(availableToolSchema).min(1);
export const workflowModeSchema = z.enum(workflowModeOptions);

export const goalFormSchema = z.object({
  workflowMode: workflowModeSchema,
  currentStage: z.enum(currentStageOptions),
  startupIdea: z.string().trim().min(3),
  industry: z.string().trim().min(1),
  targetCustomer: z.string().trim(),
  deadlineUrgency: z.enum(deadlineUrgencyOptions),
  availableTools: availableToolsSchema,
});

export type AvailableTool = z.infer<typeof availableToolSchema>;
export type WorkflowMode = z.infer<typeof workflowModeSchema>;
export type GoalFormValues = z.infer<typeof goalFormSchema>;
