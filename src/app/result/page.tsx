import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

import { AcademicIntegrityNotice } from "@/components/AcademicIntegrityNotice";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { WorkflowReviewWorkspace } from "@/components/proposal/WorkflowReviewWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  availableToolOptions,
  availableToolsSchema,
  deadlineUrgencyOptions,
  type AvailableTool,
} from "@/lib/goal-form-schema";
import { defaultLocale, isSupportedLocale } from "@/i18n/config";

type ResultPageSearchParams = {
  idea?: string;
  industry?: string;
  targetCustomer?: string;
  urgency?: string;
  availableTools?: string | string[];
};

type ResultPageProps = {
  searchParams: Promise<ResultPageSearchParams>;
};

type DeadlineUrgency = (typeof deadlineUrgencyOptions)[number];

const validDeadlineUrgencies = new Set<string>(deadlineUrgencyOptions);

function toSearchParamArray(value: string | string[] | undefined) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function parseAvailableTools(value: string | string[] | undefined) {
  const validTools = new Set<string>(availableToolOptions);
  const uniqueTools = Array.from(
    new Set(
      toSearchParamArray(value).filter(
        (tool) => tool.trim().length > 0 && validTools.has(tool),
      ),
    ),
  );
  const parsedTools = availableToolsSchema.safeParse(uniqueTools);

  return parsedTools.success ? parsedTools.data : [];
}

function isDeadlineUrgency(value: string | undefined): value is DeadlineUrgency {
  return Boolean(value && validDeadlineUrgencies.has(value));
}

function createProposalRunId({
  aiModel,
  idea,
  industry,
  targetCustomer,
  locale,
  urgency,
}: {
  aiModel: AvailableTool;
  idea: string;
  industry: string;
  targetCustomer: string;
  locale: string;
  urgency: DeadlineUrgency;
}) {
  const source = JSON.stringify({
    aiModel,
    idea,
    industry,
    targetCustomer,
    locale,
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
    idea = "",
    industry = "",
    targetCustomer = "",
    urgency = "",
    availableTools: availableToolsParam,
  } = await searchParams;
  const startupIdea = idea.trim();
  const startupIndustry = industry.trim();
  const startupTargetCustomer = targetCustomer.trim();
  const selectedDeadlineUrgency = isDeadlineUrgency(urgency) ? urgency : null;
  const selectedAvailableTools = parseAvailableTools(availableToolsParam);
  const selectedAiModel = selectedAvailableTools[0] ?? null;

  if (
    !startupIdea ||
    !startupIndustry ||
    !selectedDeadlineUrgency ||
    !selectedAiModel
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

  const workflowRunId = createProposalRunId({
    aiModel: selectedAiModel,
    idea: startupIdea,
    industry: startupIndustry,
    targetCustomer: startupTargetCustomer,
    locale,
    urgency: selectedDeadlineUrgency,
  });

  return (
    <main className="min-h-svh bg-background px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex justify-end">
          <LocaleSwitcher />
        </div>
        <WorkflowReviewWorkspace
          context={{
            aiModel: selectedAiModel,
            deadlineUrgency: selectedDeadlineUrgency,
            industry: startupIndustry,
            locale,
            startupIdea,
            targetCustomer: startupTargetCustomer,
            workflowRunId,
          }}
        />
        <AcademicIntegrityNotice compact variant="workflow" />
      </div>
    </main>
  );
}
