import type { UserGoalInput, Workflow } from "../../types";
import {
  injectWorkflowVariables as injectTemplateVariables,
  replacePromptToolReferences,
} from "@/lib/template-parser";
import { mapTool } from "@/lib/tool-mapper";

type PromptLocale = "en" | "vi";

function injectVariables(value: string, userInput: UserGoalInput): string {
  return injectTemplateVariables(value, {
    startupIdea: userInput.startupIdea,
    industry: userInput.industry,
  });
}

function getInputLocale(userInput: UserGoalInput): PromptLocale {
  return userInput.locale === "vi" ? "vi" : "en";
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
    getDeadlineInstruction(userInput.deadlineUrgency, locale),
    getStudentOutputInstruction(locale),
  ].join("\n\n");
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
        promptTemplate: appendPromptInstructions(
          injectVariables(promptTemplate, userInput),
          userInput,
        ),
        expectedOutput: injectVariables(step.expectedOutput, userInput),
        commonMistakes: step.commonMistakes.map((mistake) =>
          injectVariables(mistake, userInput),
        ),
      };
    }),
  };
}
