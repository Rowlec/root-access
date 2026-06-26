"use client";

import { Check, Copy, Download, FileDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createExportFileName,
  formatStepExport,
  formatWorkflowExport,
  type WorkflowExportFormat,
  type WorkflowExportLabels,
  type WorkflowExportStep,
} from "@/lib/workflow-export";

type WorkflowExportProps = {
  steps: WorkflowExportStep[];
  workflowTitle: string;
};

function downloadTextFile({
  content,
  fileName,
  mimeType,
}: {
  content: string;
  fileName: string;
  mimeType: string;
}) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

export function WorkflowExport({
  steps,
  workflowTitle,
}: WorkflowExportProps) {
  const t = useTranslations("WorkflowExport");
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const labels = useMemo<WorkflowExportLabels>(
    () => ({
      generatedBy: t("labels.generatedBy"),
      goal: t("labels.goal"),
      milestone: t("labels.milestone"),
      noOutput: t("labels.noOutput"),
      output: t("labels.output"),
      promptUsed: t("labels.promptUsed"),
      recommendedTool: t("labels.recommendedTool"),
    }),
    [t],
  );
  const allMarkdown = useMemo(
    () =>
      formatWorkflowExport({
        format: "markdown",
        labels,
        steps,
        workflowTitle,
      }),
    [labels, steps, workflowTitle],
  );
  const allText = useMemo(
    () =>
      formatWorkflowExport({
        format: "text",
        labels,
        steps,
        workflowTitle,
      }),
    [labels, steps, workflowTitle],
  );

  async function copyContent(content: string, key: string) {
    await navigator.clipboard.writeText(content);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1600);
  }

  function getStepContent(
    step: WorkflowExportStep,
    format: WorkflowExportFormat,
  ) {
    return formatStepExport({
      format,
      labels,
      step,
    });
  }

  function downloadWorkflow(format: WorkflowExportFormat) {
    const isMarkdown = format === "markdown";

    downloadTextFile({
      content: isMarkdown ? allMarkdown : allText,
      fileName: createExportFileName(workflowTitle, isMarkdown ? "md" : "txt"),
      mimeType: isMarkdown
        ? "text/markdown;charset=utf-8"
        : "text/plain;charset=utf-8",
    });
  }

  function downloadStep(
    step: WorkflowExportStep,
    format: WorkflowExportFormat,
  ) {
    const isMarkdown = format === "markdown";

    downloadTextFile({
      content: getStepContent(step, format),
      fileName: createExportFileName(
        `${workflowTitle}-${step.step.id}-${step.step.title}`,
        isMarkdown ? "md" : "txt",
      ),
      mimeType: isMarkdown
        ? "text/markdown;charset=utf-8"
        : "text/plain;charset=utf-8",
    });
  }

  return (
    <Card className="rounded-lg border-primary/20 bg-muted/40 py-5 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription className="text-sm leading-6">
            {t("description")}
          </CardDescription>
        </div>
        <Button
          type="button"
          className="h-10 w-full sm:w-auto"
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((current) => !current)}
        >
          <FileDown aria-hidden="true" />
          {t("toggle")}
        </Button>
      </CardHeader>

      {isExpanded ? (
        <CardContent className="grid gap-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full justify-center sm:w-auto"
              onClick={() => copyContent(allMarkdown, "all")}
            >
              {copiedKey === "all" ? (
                <Check aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
              {copiedKey === "all" ? t("copied") : t("copyAll")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full justify-center sm:w-auto"
              onClick={() => downloadWorkflow("markdown")}
            >
              <Download aria-hidden="true" />
              {t("downloadMarkdown")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full justify-center sm:w-auto"
              onClick={() => downloadWorkflow("text")}
            >
              <Download aria-hidden="true" />
              {t("downloadText")}
            </Button>
          </div>

          <div className="grid gap-3">
            <h2 className="text-sm font-medium text-foreground">
              {t("individualTitle")}
            </h2>
            <ol className="grid gap-2">
              {steps.map((step) => {
                const stepCopyKey = `step-${step.step.id}`;

                return (
                  <li
                    key={step.step.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t("milestoneLabel", { step: step.step.id })}
                      </p>
                      <p className="line-clamp-2 text-sm font-medium text-foreground">
                        {step.step.title}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:flex sm:shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="justify-center"
                        onClick={() =>
                          copyContent(
                            getStepContent(step, "markdown"),
                            stepCopyKey,
                          )
                        }
                      >
                        {copiedKey === stepCopyKey ? (
                          <Check aria-hidden="true" />
                        ) : (
                          <Copy aria-hidden="true" />
                        )}
                        {copiedKey === stepCopyKey
                          ? t("copiedShort")
                          : t("copyStep")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="justify-center"
                        onClick={() => downloadStep(step, "markdown")}
                      >
                        <Download aria-hidden="true" />
                        {t("markdownShort")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="justify-center"
                        onClick={() => downloadStep(step, "text")}
                      >
                        <Download aria-hidden="true" />
                        {t("textShort")}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
