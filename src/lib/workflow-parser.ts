import type { UserGoalInput, Workflow } from "../../types";
import {
  injectWorkflowVariables as injectTemplateVariables,
  replacePromptToolReferences,
} from "@/lib/template-parser";
import { mapTool } from "@/lib/tool-mapper";

type PromptLocale = "en" | "vi";
type WorkflowToolRecommendation = NonNullable<
  Workflow["steps"][number]["toolRecommendation"]
>;
type WorkflowToolAlternative =
  WorkflowToolRecommendation["alternativeTools"][number];

function injectVariables(value: string, userInput: UserGoalInput): string {
  const locale = getInputLocale(userInput);

  return injectTemplateVariables(value, {
    startupIdea: userInput.startupIdea,
    industry: userInput.industry,
    targetCustomer: getTargetCustomerLabel(userInput, locale),
    deadlineUrgency: getDeadlineUrgencyLabel(
      userInput.deadlineUrgency,
      locale,
    ),
    preferredAiTools: getPreferredAiToolsLabel(userInput, locale),
  });
}

function getInputLocale(userInput: UserGoalInput): PromptLocale {
  return userInput.locale === "vi" ? "vi" : "en";
}

function getTargetCustomerLabel(
  userInput: UserGoalInput,
  locale: PromptLocale,
) {
  const targetCustomer = userInput.targetCustomer.trim();

  if (targetCustomer.length > 0) {
    return targetCustomer;
  }

  return locale === "vi"
    ? "chưa xác định, hãy đề xuất một phân khúc khách hàng đầu tiên hẹp"
    : "not specified yet; suggest one narrow first customer segment";
}

function getPreferredAiToolsLabel(
  userInput: UserGoalInput,
  locale: PromptLocale,
) {
  const preferredTools = Array.from(new Set(userInput.availableTools));

  if (preferredTools.length > 0) {
    return preferredTools.join(", ");
  }

  return locale === "vi"
    ? "gợi ý mặc định của Root Access"
    : "Root Access default recommendations";
}

function getDeadlineUrgencyLabel(
  deadlineUrgency: string,
  locale: PromptLocale,
) {
  const labels: Record<PromptLocale, Record<string, string>> = {
    en: {
      "1-3 days": "1-3 days",
      "1 week": "1 week",
      "2 weeks+": "2 weeks+",
      "No deadline": "No deadline",
    },
    vi: {
      "1-3 days": "1-3 ngày",
      "1 week": "1 tuần",
      "2 weeks+": "2 tuần trở lên",
      "No deadline": "Không có hạn nộp",
    },
  };

  return labels[locale][deadlineUrgency] ?? deadlineUrgency;
}

function getPromptContextInstruction(
  userInput: UserGoalInput,
  locale: PromptLocale,
) {
  if (locale === "vi") {
    return [
      "Bối cảnh người dùng:",
      `- Ý tưởng khởi nghiệp: ${userInput.startupIdea}`,
      `- Lĩnh vực: ${userInput.industry}`,
      `- Khách hàng mục tiêu: ${getTargetCustomerLabel(userInput, locale)}`,
      `- Hạn nộp: ${getDeadlineUrgencyLabel(userInput.deadlineUrgency, locale)}`,
      
      "Hãy dùng bối cảnh này trong mọi gợi ý. Nếu khách hàng mục tiêu chưa rõ, hãy đề xuất một phân khúc đầu tiên đủ hẹp trước khi tiếp tục.",
    ].join("\n");
  }

  return [
    "User context:",
    `- Startup idea: ${userInput.startupIdea}`,
    `- Industry: ${userInput.industry}`,
    `- Target customer: ${getTargetCustomerLabel(userInput, locale)}`,
    `- Deadline urgency: ${getDeadlineUrgencyLabel(
      userInput.deadlineUrgency,
      locale,
    )}`,
    "Use this context in every recommendation. If the target customer is not specific yet, suggest one narrow first segment before continuing.",
  ].join("\n");
}

function getDeadlineInstruction(
  deadlineUrgency: string,
  locale: PromptLocale,
) {
  const instructions: Record<PromptLocale, Record<string, string>> = {
    en: {
      "1-3 days":
        "Deadline mode: quick first draft. Prioritize the smallest useful answer, clear bullets, and the next action a student can finish today.",
      "1 week":
        "Deadline mode: standard. Keep the answer practical and structured so it can become a proposal section this week.",
      "2 weeks+":
        "Deadline mode: deep. Add assumptions, evidence to collect, and a stronger recommendation.",
      "No deadline":
        "Deadline mode: exploratory. Compare alternatives and explain tradeoffs before recommending the best path.",
    },
    vi: {
      "1-3 days":
        "Chế độ hạn nộp: bản nháp nhanh. Ưu tiên câu trả lời nhỏ nhất nhưng hữu ích, bullet rõ ràng và một hành động sinh viên có thể hoàn thành hôm nay.",
      "1 week":
        "Chế độ hạn nộp: tiêu chuẩn. Giữ câu trả lời thực tế và có cấu trúc để có thể chuyển thành một phần proposal trong tuần này.",
      "2 weeks+":
        "Chế độ hạn nộp: phân tích sâu. Thêm giả định, bằng chứng cần thu thập và khuyến nghị chắc hơn.",
      "No deadline":
        "Chế độ hạn nộp: khám phá. So sánh các lựa chọn và giải thích trade-off trước khi đề xuất hướng tốt nhất.",
    },
  };

  return instructions[locale][deadlineUrgency] ?? instructions[locale]["No deadline"];
}

function getStudentOutputInstruction(locale: PromptLocale) {
  if (locale === "vi") {
    return "Định dạng cho sinh viên kinh doanh FPT University: tóm tắt ngắn, bảng/checklist khi hữu ích, giả định cần kiểm chứng và một hành động tiếp theo cụ thể.";
  }

  return "Format for an FPT University business student: concise summary, table/checklist where useful, assumptions to verify, and one concrete next action.";
}

function appendPromptInstructions(
  promptTemplate: string,
  userInput: UserGoalInput,
) {
  const locale = getInputLocale(userInput);

  return [
    promptTemplate,
    getPromptContextInstruction(userInput, locale),
    getDeadlineInstruction(userInput.deadlineUrgency, locale),
    getStudentOutputInstruction(locale),
  ].join("\n\n");
}

function injectPromptAssist(
  promptAssist: Workflow["steps"][number]["promptAssist"],
  userInput: UserGoalInput,
) {
  if (!promptAssist) {
    return undefined;
  }

  return {
    whyItWorks: injectVariables(promptAssist.whyItWorks, userInput),
    aiFocus: injectVariables(promptAssist.aiFocus, userInput),
    customize: injectVariables(promptAssist.customize, userInput),
    editingMistakes: promptAssist.editingMistakes.map((mistake) =>
      injectVariables(mistake, userInput),
    ),
  };
}

function injectPromptComparison(
  promptComparison: Workflow["steps"][number]["promptComparison"],
  userInput: UserGoalInput,
  originalTool: string,
  adaptedTool: string,
) {
  if (!promptComparison) {
    return undefined;
  }

  return {
    weakPrompt: injectVariables(
      replacePromptToolReferences(
        promptComparison.weakPrompt,
        originalTool,
        adaptedTool,
      ),
      userInput,
    ),
    explanation: injectVariables(
      replacePromptToolReferences(
        promptComparison.explanation,
        originalTool,
        adaptedTool,
      ),
      userInput,
    ),
  };
}

function toolsMatch(firstTool: string, secondTool: string) {
  return firstTool.trim().toLowerCase() === secondTool.trim().toLowerCase();
}

function hasPreferredTool(userInput: UserGoalInput, tool: string) {
  return userInput.availableTools.some((availableTool) =>
    toolsMatch(availableTool, tool),
  );
}

function getPreferenceNote(locale: PromptLocale) {
  return locale === "vi"
    ? "Được ưu tiên vì công cụ này nằm trong lựa chọn của bạn."
    : "Prioritized because this tool is in your selected AI tools.";
}

function getFallbackToolReason(tool: string, locale: PromptLocale) {
  if (tool.trim().length === 0) {
    return locale === "vi"
      ? "Dùng công cụ bạn đang có, nhưng vẫn giữ prompt và checklist của milestone này để bảo đảm đầu ra có cấu trúc."
      : "Use the tool you already have, while keeping this milestone's prompt and checklist to keep the output structured.";
  }

  return locale === "vi"
    ? "Đây là một công cụ bạn đã chọn, nên phù hợp khi bạn muốn xử lý milestone này trong môi trường quen thuộc."
    : "This is one of your selected tools, so it fits when you want to keep this milestone inside a familiar workspace.";
}

function uniqueToolAlternatives(alternatives: WorkflowToolAlternative[]) {
  const seenTools = new Set<string>();

  return alternatives.filter((alternative) => {
    const normalizedTool = alternative.tool.trim().toLowerCase();

    if (seenTools.has(normalizedTool)) {
      return false;
    }

    seenTools.add(normalizedTool);
    return true;
  });
}

function injectToolRecommendation(
  toolRecommendation: Workflow["steps"][number]["toolRecommendation"],
  userInput: UserGoalInput,
  adaptedTool: string,
) {
  if (!toolRecommendation) {
    return undefined;
  }

  const locale = getInputLocale(userInput);
  const primaryTool = injectVariables(toolRecommendation.recommendedTool, userInput);
  const primaryAlternative = {
    tool: primaryTool,
    reason: injectVariables(toolRecommendation.whyItFits, userInput),
  };
  const alternativeTools = toolRecommendation.alternativeTools.map(
    (alternativeTool) => ({
      tool: injectVariables(alternativeTool.tool, userInput),
      reason: injectVariables(alternativeTool.reason, userInput),
    }),
  );
  const recommendationOptions = uniqueToolAlternatives([
    primaryAlternative,
    ...alternativeTools,
  ]);
  const selectedOption = recommendationOptions.find((option) =>
    toolsMatch(option.tool, adaptedTool),
  );
  const adaptedAlternativeTools = uniqueToolAlternatives(
    recommendationOptions.filter(
      (option) => !toolsMatch(option.tool, adaptedTool),
    ),
  )
    .sort((firstOption, secondOption) => {
      const firstIsPreferred = hasPreferredTool(userInput, firstOption.tool);
      const secondIsPreferred = hasPreferredTool(userInput, secondOption.tool);

      return Number(secondIsPreferred) - Number(firstIsPreferred);
    })
    .slice(0, 2);
  const isPreferredTool = hasPreferredTool(userInput, adaptedTool);

  return {
    recommendedTool: adaptedTool,
    whyItFits:
      selectedOption?.reason ?? getFallbackToolReason(adaptedTool, locale),
    preferenceNote: isPreferredTool ? getPreferenceNote(locale) : undefined,
    alternativeTools: adaptedAlternativeTools,
  };
}

export function injectWorkflowVariables(
  workflow: Workflow,
  userInput: UserGoalInput,
): Workflow {
  return {
    ...workflow,
    title: injectVariables(workflow.title, userInput),
    description: injectVariables(workflow.description, userInput),
    category: injectVariables(workflow.category, userInput),
    estimatedTime: injectVariables(workflow.estimatedTime, userInput),
    steps: workflow.steps.map((step) => {
      const originalTool = injectVariables(
        step.originalTool ?? step.tool,
        userInput,
      );
      const adaptedTool = mapTool(originalTool, userInput.availableTools);
      const promptTemplate = replacePromptToolReferences(
        step.promptTemplate,
        originalTool,
        adaptedTool,
      );

      return {
        ...step,
        title: injectVariables(step.title, userInput),
        goal: injectVariables(step.goal, userInput),
        tool: adaptedTool,
        originalTool,
        adaptedTool: adaptedTool === originalTool ? undefined : adaptedTool,
        toolRecommendation: injectToolRecommendation(
          step.toolRecommendation,
          userInput,
          adaptedTool,
        ),
        promptTemplate: appendPromptInstructions(
          injectVariables(promptTemplate, userInput),
          userInput,
        ),
        promptAssist: injectPromptAssist(step.promptAssist, userInput),
        promptComparison: injectPromptComparison(
          step.promptComparison,
          userInput,
          originalTool,
          adaptedTool,
        ),
        qualityChecklist: step.qualityChecklist?.map((item) =>
          injectVariables(item, userInput),
        ),
        expectedOutput: injectVariables(step.expectedOutput, userInput),
        commonMistakes: step.commonMistakes.map((mistake) =>
          injectVariables(mistake, userInput),
        ),
      };
    }),
  };
}
