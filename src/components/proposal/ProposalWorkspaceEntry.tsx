"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { AcademicIntegrityNotice } from "@/components/AcademicIntegrityNotice";
import { WorkflowReviewWorkspace } from "@/components/proposal/WorkflowReviewWorkspace";
import { WorkflowServerSync } from "@/components/proposal/WorkflowServerSync";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { goalFormSchema } from "@/lib/goal-form-schema";
import {
  isProposalSectionId,
  type ProposalSectionId,
} from "@/lib/proposal-review";
import { isWorkflowPhase, type WorkflowPhase } from "@/lib/workflow-route";
import { createProposalRunId } from "@/lib/proposal-run";

const goalContextStorageKey = "root-access:startup-context";

type ProposalWorkspaceEntryProps = {
  phase?: string;
  sectionId?: string;
};

export function ProposalWorkspaceEntry({
  phase,
  sectionId,
}: ProposalWorkspaceEntryProps) {
  const router = useRouter();
  const t = useTranslations("ResultPage");
  const [isHydrated, setIsHydrated] = useState(false);
  const [context, setContext] = useState<{
    industry: string;
    startupIdea: string;
    targetCustomer: string;
  } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedValue = window.localStorage.getItem(goalContextStorageKey);
        const parsed = storedValue
          ? goalFormSchema.safeParse(JSON.parse(storedValue))
          : null;

        if (parsed?.success) {
          setContext({
            industry: parsed.data.industry,
            startupIdea: parsed.data.startupIdea,
            targetCustomer: parsed.data.targetCustomer,
          });
        }
      } catch {
        setContext(null);
      } finally {
        setIsHydrated(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isHydrated || !context) {
      return;
    }

    const safeSection = isProposalSectionId(sectionId ?? "")
      ? sectionId
      : "problem";
    const safePhase = isWorkflowPhase(phase ?? "") ? phase : "generate";

    if (safeSection !== sectionId || safePhase !== phase) {
      router.replace(`/result/${safeSection}/${safePhase}`);
    }
  }, [context, isHydrated, phase, router, sectionId]);

  if (!isHydrated) {
    return <main className="min-h-svh px-5 py-10 sm:px-8 sm:py-14 lg:px-10" />;
  }

  if (!context) {
    return (
      <main className="min-h-svh px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <section className="glass rounded-3xl p-6 sm:p-8">
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

  const locale = document.documentElement.lang === "vi" ? "vi" : "en";
  const requestedSectionId = sectionId ?? "";
  const activeSectionId: ProposalSectionId = isProposalSectionId(requestedSectionId)
    ? requestedSectionId
    : "problem";
  const requestedPhase = phase ?? "";
  const activePhase: WorkflowPhase = isWorkflowPhase(requestedPhase)
    ? requestedPhase
    : "generate";
  const workflowRunId = createProposalRunId({
    idea: context.startupIdea,
    industry: context.industry,
    targetCustomer: context.targetCustomer,
    locale,
  });

  return (
    <main className="min-h-svh px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <WorkflowServerSync workflowRunId={workflowRunId} />
        <WorkflowReviewWorkspace
          activeSectionId={activeSectionId}
          phase={activePhase}
          context={{
            deadlineUrgency: "No deadline",
            industry: context.industry,
            locale,
            startupIdea: context.startupIdea,
            targetCustomer: context.targetCustomer,
            workflowRunId,
          }}
        />
        <AcademicIntegrityNotice compact variant="workflow" />
      </div>
    </main>
  );
}
