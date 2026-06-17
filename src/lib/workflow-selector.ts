import { businessModelDesignWorkflow } from "@/data/workflows/business-model";
import { ideaValidationWorkflow } from "@/data/workflows/idea-validation";
import { marketResearchWorkflow } from "@/data/workflows/market-research";
import { mvpPlanningWorkflow } from "@/data/workflows/mvp-planning";
import { pitchDeckPreparationWorkflow } from "@/data/workflows/pitch-deck";
import {
  businessModelDesignWorkflowVi,
  ideaValidationWorkflowVi,
  marketResearchWorkflowVi,
  mvpPlanningWorkflowVi,
  pitchDeckPreparationWorkflowVi,
} from "@/data/workflows/vi";
import type { StartupWorkflow } from "@/data/workflows";
import {
  currentStageOptions,
  type GoalFormValues,
} from "@/lib/goal-form-schema";
import {
  defaultLocale,
  isSupportedLocale,
  type Locale,
} from "@/i18n/config";
import type { Workflow } from "../../types";

type StartupStage = GoalFormValues["currentStage"];

const defaultStage: StartupStage = "No clear idea yet";

const workflowRulesEn = {
  "No clear idea yet": ideaValidationWorkflow,
  "Have idea but not validated": marketResearchWorkflow,
  "Doing market research": businessModelDesignWorkflow,
  "Building business model": mvpPlanningWorkflow,
  "Preparing pitch deck": pitchDeckPreparationWorkflow,
} satisfies Record<StartupStage, StartupWorkflow>;

const workflowRulesVi = {
  "No clear idea yet": ideaValidationWorkflowVi,
  "Have idea but not validated": marketResearchWorkflowVi,
  "Doing market research": businessModelDesignWorkflowVi,
  "Building business model": mvpPlanningWorkflowVi,
  "Preparing pitch deck": pitchDeckPreparationWorkflowVi,
} satisfies Record<StartupStage, StartupWorkflow>;

const localizedWorkflowRules = {
  en: workflowRulesEn,
  vi: workflowRulesVi,
} satisfies Record<Locale, Record<StartupStage, StartupWorkflow>>;

const localizedCategory = {
  en: "Startup Proposal",
  vi: "Đề xuất khởi nghiệp",
} satisfies Record<Locale, string>;

const validStages = new Set<string>(currentStageOptions);

export function isStartupStage(stage: string | undefined): stage is StartupStage {
  return Boolean(stage && validStages.has(stage));
}

function getWorkflowLocale(locale: string | undefined): Locale {
  return isSupportedLocale(locale) ? locale : defaultLocale;
}

function toRenderableWorkflow(
  workflow: StartupWorkflow,
  locale: Locale,
): Workflow {
  return {
    id: workflow.id,
    title: workflow.title,
    description: workflow.description,
    category: localizedCategory[locale],
    estimatedTime: workflow.estimatedTime,
    steps: workflow.steps.map((step, index) => ({
      id: index + 1,
      title: step.title,
      goal: step.goal,
      tool: step.recommendedTool,
      originalTool: step.originalRecommendedTool,
      adaptedTool: step.adaptedRecommendedTool,
      promptTemplate: step.promptTemplate,
      expectedOutput: step.expectedOutput,
      commonMistakes: [...step.commonMistakes],
    })),
  };
}

export function selectWorkflow(
  currentStage: string | undefined,
  locale: string = defaultLocale,
): Workflow {
  const workflowLocale = getWorkflowLocale(locale);
  const selectedStage = isStartupStage(currentStage)
    ? currentStage
    : defaultStage;
  const selectedWorkflow = localizedWorkflowRules[workflowLocale][selectedStage];

  return toRenderableWorkflow(selectedWorkflow, workflowLocale);
}
