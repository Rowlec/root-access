import { Clock } from "lucide-react";
import Link from "next/link";

import { AcademicIntegrityNotice } from "@/components/AcademicIntegrityNotice";
import { Button } from "@/components/ui/button";
import { FeedbackForm } from "@/components/workflow/FeedbackForm";
import { ProgressTracker } from "@/components/workflow/ProgressTracker";
import { Badge } from "@/components/ui/badge";
import { getStartupWorkflow } from "@/lib/workflow-loader";
import { injectWorkflowVariables } from "@/lib/workflow-parser";

type ResultPageProps = {
  searchParams: Promise<{
    idea?: string;
    industry?: string;
  }>;
};

export default async function ResultPage({ searchParams }: ResultPageProps) {
  const { idea = "", industry = "" } = await searchParams;
  const hasMissingContext = !idea || !industry;
  const workflow = injectWorkflowVariables(getStartupWorkflow(), {
    currentStage: "",
    startupIdea: idea,
    industry,
    deadlineUrgency: "",
  });

  return (
    <main className="min-h-svh bg-background px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
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

          {hasMissingContext ? (
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
              Missing startup context. You can still review the workflow, or go
              back and enter your startup idea and industry for personalized
              prompts.
            </div>
          ) : null}
        </section>

        <AcademicIntegrityNotice compact />

        <ProgressTracker
          workflowId={workflow.id}
          workflowTitle={workflow.title}
          steps={workflow.steps}
        />

        <section className="rounded-lg border border-border bg-muted/40 p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                Finished your first proposal draft?
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Review your copied prompts and turn the outputs into your final
                submission.
              </p>
            </div>
            <Button asChild variant="outline" className="h-10 w-full sm:w-auto">
              <Link href="/">Build another workflow</Link>
            </Button>
          </div>
        </section>

        <FeedbackForm />
      </div>
    </main>
  );
}
