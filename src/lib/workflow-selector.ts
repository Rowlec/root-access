import { startupProposalWorkflow } from "@/data/workflows/startup-proposal";
import { startupProposalWorkflowVi } from "@/data/workflows/startup-proposal.vi";
import type { StartupWorkflow } from "@/data/workflows";
import {
  currentStageOptions,
  type GoalFormValues,
  type WorkflowMode,
  workflowModeOptions,
} from "@/lib/goal-form-schema";
import {
  defaultLocale,
  isSupportedLocale,
  type Locale,
} from "@/i18n/config";
import type { Workflow } from "../../types";

type StartupStage = GoalFormValues["currentStage"];
type ModeMeta = {
  title: string;
  description: string;
  estimatedTime: string;
  category: string;
};
type StageMeta = {
  label: string;
  description: string;
};
type StartupStep = StartupWorkflow["steps"][number];

const defaultStage: StartupStage = "No clear idea yet";
const defaultWorkflowMode: WorkflowMode = "deep";

const localizedWorkflowLibrary = {
  en: startupProposalWorkflow,
  vi: startupProposalWorkflowVi,
} satisfies Record<Locale, StartupWorkflow>;

const stageStepIndexes = {
  "No clear idea yet": [0, 1, 3],
  "Have idea but not validated": [2, 3, 6],
  "Doing market research": [4, 5, 7],
  "Building business model": [8, 9, 14],
  "Planning MVP": [15, 16, 17],
  "Preparing pitch deck": [12, 10, 13],
} satisfies Record<StartupStage, readonly number[]>;

const stageKeys = {
  "No clear idea yet": "clarify-idea",
  "Have idea but not validated": "validate-idea",
  "Doing market research": "market-research",
  "Building business model": "business-model",
  "Planning MVP": "mvp-scope",
  "Preparing pitch deck": "proposal-structure",
} satisfies Record<StartupStage, string>;

const localizedModeMeta: Record<Locale, Record<WorkflowMode, ModeMeta>> = {
  en: {
    quick: {
      title: "Quick Micro-steps",
      description:
        "A short branch for [STAGE DESCRIPTION]. Copy each prompt, paste the useful output, then move on.",
      estimatedTime: "6 minutes",
      category: "Startup Proposal - Quick Branch",
    },
    deep: {
      title: "Guided Micro-steps",
      description:
        "A coached branch for [STAGE DESCRIPTION], with prompt guidance and quality checks.",
      estimatedTime: "10 minutes",
      category: "Startup Proposal - Deep Branch",
    },
  },
  vi: {
    quick: {
      title: "Micro-step nhanh",
      description:
        "Một nhánh ngắn cho [STAGE DESCRIPTION]. Copy từng prompt, dán output hữu ích, rồi đi tiếp.",
      estimatedTime: "6 phút",
      category: "Đề xuất khởi nghiệp - Nhánh nhanh",
    },
    deep: {
      title: "Micro-step có hướng dẫn",
      description:
        "Một nhánh có coaching cho [STAGE DESCRIPTION], kèm hướng dẫn prompt và kiểm tra chất lượng.",
      estimatedTime: "10 phút",
      category: "Đề xuất khởi nghiệp - Nhánh sâu",
    },
  },
};

const localizedStageMeta: Record<Locale, Record<StartupStage, StageMeta>> = {
  en: {
    "No clear idea yet": {
      label: "Clarify startup idea",
      description:
        "clarifying the pain point, first customer, and validation action for [STARTUP IDEA]",
    },
    "Have idea but not validated": {
      label: "Validate existing idea",
      description:
        "turning [STARTUP IDEA] into testable assumptions, a validation action, and a research channel",
    },
    "Doing market research": {
      label: "Market and competitor research",
      description:
        "narrowing the first market, mapping alternatives, and listing facts to verify",
    },
    "Building business model": {
      label: "Build business model",
      description:
        "choosing a revenue stream, pricing logic, and willingness-to-pay test",
    },
    "Planning MVP": {
      label: "Plan MVP scope",
      description:
        "defining core value, feature priority, and what to exclude from the MVP",
    },
    "Preparing pitch deck": {
      label: "Prepare proposal structure",
      description:
        "turning notes into a proposal outline, competitor difference, and verification edits",
    },
  },
  vi: {
    "No clear idea yet": {
      label: "Làm rõ ý tưởng khởi nghiệp",
      description:
        "làm rõ pain point, nhóm khách hàng đầu tiên và hành động kiểm chứng cho [STARTUP IDEA]",
    },
    "Have idea but not validated": {
      label: "Kiểm chứng ý tưởng hiện có",
      description:
        "biến [STARTUP IDEA] thành giả định có thể kiểm chứng, hành động validation và kênh nghiên cứu",
    },
    "Doing market research": {
      label: "Nghiên cứu thị trường và đối thủ",
      description:
        "thu hẹp thị trường đầu tiên, map lựa chọn thay thế và liệt kê facts cần kiểm chứng",
    },
    "Building business model": {
      label: "Xây dựng mô hình kinh doanh",
      description:
        "chọn nguồn doanh thu, logic giá và cách kiểm chứng willingness to pay",
    },
    "Planning MVP": {
      label: "Lập phạm vi MVP",
      description:
        "xác định core value, ưu tiên tính năng và phần cần loại khỏi MVP",
    },
    "Preparing pitch deck": {
      label: "Chuẩn bị cấu trúc proposal",
      description:
        "chuyển ghi chú thành dàn ý proposal, điểm khác biệt và checklist kiểm chứng",
    },
  },
};

const validStages = new Set<string>(currentStageOptions);
const validWorkflowModes = new Set<string>(workflowModeOptions);

export function isStartupStage(stage: string | undefined): stage is StartupStage {
  return Boolean(stage && validStages.has(stage));
}

export function isWorkflowMode(mode: string | undefined): mode is WorkflowMode {
  return Boolean(mode && validWorkflowModes.has(mode));
}

function getWorkflowLocale(locale: string | undefined): Locale {
  return isSupportedLocale(locale) ? locale : defaultLocale;
}

function cloneToolRecommendation(step: StartupStep) {
  if (!step.toolRecommendation) {
    return undefined;
  }

  return {
    recommendedTool: step.toolRecommendation.recommendedTool,
    whyItFits: step.toolRecommendation.whyItFits,
    alternativeTools: step.toolRecommendation.alternativeTools.map(
      (alternativeTool) => ({
        tool: alternativeTool.tool,
        reason: alternativeTool.reason,
      }),
    ),
  };
}

function getStageSteps(workflow: StartupWorkflow, stage: StartupStage) {
  return stageStepIndexes[stage]
    .map((stepIndex) => workflow.steps[stepIndex])
    .filter((step): step is StartupStep => Boolean(step));
}

function getModeDescription(modeMeta: ModeMeta, stageMeta: StageMeta) {
  return modeMeta.description.replaceAll(
    "[STAGE DESCRIPTION]",
    stageMeta.description,
  );
}

function toRenderableWorkflow(
  workflow: StartupWorkflow,
  locale: Locale,
  mode: WorkflowMode,
  stage: StartupStage,
): Workflow {
  const modeMeta = localizedModeMeta[locale][mode];
  const stageMeta = localizedStageMeta[locale][stage];
  const stepsForStage = getStageSteps(workflow, stage);

  return {
    id: `${workflow.id}-${stageKeys[stage]}-${mode}`,
    title: `${stageMeta.label} - ${modeMeta.title}`,
    description: getModeDescription(modeMeta, stageMeta),
    category: `${modeMeta.category} - ${stageMeta.label}`,
    estimatedTime: modeMeta.estimatedTime,
    steps: stepsForStage.map((step, index) => ({
      id: index + 1,
      title: step.title,
      goal: step.goal,
      timebox: step.timebox,
      tool: step.recommendedTool,
      originalTool: step.originalRecommendedTool,
      adaptedTool: step.adaptedRecommendedTool,
      toolRecommendation: cloneToolRecommendation(step),
      promptTemplate: step.promptTemplate,
      promptAssist:
        mode === "deep" && step.promptAssist
          ? {
              whyItWorks: step.promptAssist.whyItWorks,
              aiFocus: step.promptAssist.aiFocus,
              customize: step.promptAssist.customize,
              editingMistakes: [...step.promptAssist.editingMistakes],
            }
          : undefined,
      promptComparison:
        mode === "deep" && step.promptComparison
          ? {
              weakPrompt: step.promptComparison.weakPrompt,
              explanation: step.promptComparison.explanation,
            }
          : undefined,
      qualityChecklist:
        mode === "deep" && step.qualityChecklist
          ? [...step.qualityChecklist]
          : undefined,
      expectedOutput: step.expectedOutput,
      commonMistakes: [...step.commonMistakes],
    })),
  };
}

export function selectWorkflow(
  currentStage: string | undefined,
  locale: string = defaultLocale,
  mode: string = defaultWorkflowMode,
): Workflow {
  const workflowLocale = getWorkflowLocale(locale);
  const workflowMode = isWorkflowMode(mode) ? mode : defaultWorkflowMode;
  const selectedStage = isStartupStage(currentStage)
    ? currentStage
    : defaultStage;
  const workflow = localizedWorkflowLibrary[workflowLocale];

  return toRenderableWorkflow(
    workflow,
    workflowLocale,
    workflowMode,
    selectedStage,
  );
}
