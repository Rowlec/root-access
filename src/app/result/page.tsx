import { Clock } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

import { AcademicIntegrityNotice } from "@/components/AcademicIntegrityNotice";
import { WorkflowAnalytics } from "@/components/analytics/WorkflowAnalytics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeedbackForm } from "@/components/workflow/FeedbackForm";
import { ProgressTracker } from "@/components/workflow/ProgressTracker";
import {
  availableToolsSchema,
  deadlineUrgencyOptions,
  type AvailableTool,
} from "@/lib/goal-form-schema";
import { defaultLocale, isSupportedLocale } from "@/i18n/config";
import { injectWorkflowVariables } from "@/lib/workflow-parser";
import { isStartupStage, selectWorkflow } from "@/lib/workflow-selector";

type ResultPageSearchParams = {
  stage?: string;
  idea?: string;
  industry?: string;
  urgency?: string;
  availableTools?: string | string[];
};

type ResultPageProps = {
  searchParams: Promise<ResultPageSearchParams>;
};

function toSearchParamArray(value: string | string[] | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function parseAvailableTools(value: string | string[] | undefined) {
  const uniqueTools = Array.from(
    new Set(toSearchParamArray(value).filter((tool) => tool.trim().length > 0)),
  );
  const parsedTools = availableToolsSchema.safeParse(uniqueTools);

  return parsedTools.success ? parsedTools.data : null;
}

type DeadlineUrgency = (typeof deadlineUrgencyOptions)[number];

const validDeadlineUrgencies = new Set<string>(deadlineUrgencyOptions);

function isDeadlineUrgency(value: string | undefined): value is DeadlineUrgency {
  return Boolean(value && validDeadlineUrgencies.has(value));
}

function createWorkflowRunId({
  availableTools,
  idea,
  industry,
  locale,
  stage,
  urgency,
}: {
  availableTools: AvailableTool[];
  idea: string;
  industry: string;
  locale: string;
  stage: string;
  urgency: DeadlineUrgency;
}) {
  const source = JSON.stringify({
    availableTools: [...availableTools].sort(),
    idea,
    industry,
    locale,
    stage,
    urgency,
  });
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

export default async function ResultPage({ searchParams }: ResultPageProps) {
  const requestedLocale = await getLocale();
  const locale = isSupportedLocale(requestedLocale)
    ? requestedLocale
    : defaultLocale;
  const t = await getTranslations("ResultPage");
  const {
    stage = "",
    idea = "",
    industry = "",
    urgency = "",
    availableTools: availableToolsParam,
  } = await searchParams;
  const startupIdea = idea.trim();
  const startupIndustry = industry.trim();
  const selectedStage = isStartupStage(stage) ? stage : null;
  const selectedDeadlineUrgency = isDeadlineUrgency(urgency) ? urgency : null;
  const selectedAvailableTools = parseAvailableTools(availableToolsParam);

  if (
    !startupIdea ||
    !startupIndustry ||
    !selectedStage ||
    !selectedDeadlineUrgency ||
    !selectedAvailableTools
  ) {
    return (
      <main className="min-h-svh bg-background px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <section className="rounded-lg border border-border bg-muted/40 p-6 shadow-sm sm:p-8">
            <div className="max-w-2xl space-y-4">
              <Badge variant="secondary">{t("emptyState.badge")}</Badge>
              <h1 className="text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
                {t("emptyState.title")}
              </h1>
              <p className="text-base leading-7 text-muted-foreground">
                {t("emptyState.description")}
              </p>
              <Button asChild className="h-10">
                <Link href="/">{t("emptyState.action")}</Link>
              </Button>
            </div>
          </section>

          <AcademicIntegrityNotice compact variant="workflow" />
        </div>
      </main>
    );
  }

  const availableTools = selectedAvailableTools;
  const workflowRunId = createWorkflowRunId({
    availableTools,
    idea: startupIdea,
    industry: startupIndustry,
    locale,
    stage: selectedStage,
    urgency: selectedDeadlineUrgency,
  });
  const workflow = injectWorkflowVariables(selectWorkflow(selectedStage, locale), {
    currentStage: selectedStage,
    startupIdea,
    industry: startupIndustry,
    deadlineUrgency: selectedDeadlineUrgency,
    availableTools,
    locale,
  });
  const adaptedToolCount = workflow.steps.filter(
    (step) => step.adaptedTool && step.adaptedTool !== step.originalTool,
  ).length;

  return (
    <main className="min-h-svh bg-background px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <WorkflowAnalytics
        workflowId={workflow.id}
        workflowRunId={workflowRunId}
        workflowTitle={workflow.title}
        availableTools={availableTools}
        steps={workflow.steps}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="space-y-5 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">{workflow.category}</Badge>
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Clock aria-hidden="true" className="size-4" />
              {workflow.estimatedTime}
            </span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl sm:leading-[1.12]">
              {workflow.title}
            </h1>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              {workflow.description}
            </p>
          </div>

        </section>

        <AcademicIntegrityNotice compact variant="workflow" />

        <ProgressTracker
          workflowId={workflow.id}
          workflowTitle={workflow.title}
          workflowRunId={workflowRunId}
          availableTools={availableTools}
          steps={workflow.steps}
        />

        <section className="rounded-lg border border-border bg-muted/40 p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                {t("completionCta.title")}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("completionCta.description")}
              </p>
            </div>
            <Button asChild variant="outline" className="h-10 w-full sm:w-auto">
              <Link href="/">{t("completionCta.action")}</Link>
            </Button>
          </div>
        </section>

        <FeedbackForm
          adaptedToolCount={adaptedToolCount}
          availableTools={availableTools}
          workflowId={workflow.id}
          workflowRunId={workflowRunId}
          workflowTitle={workflow.title}
        />
      </div>
    </main>
  );
}
