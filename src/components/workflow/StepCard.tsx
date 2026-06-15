"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkflowStep } from "../../../types";

type StepCardProps = {
  step: WorkflowStep;
  canComplete: boolean;
  isCompleted: boolean;
  onCompletedChange: (isCompleted: boolean) => void;
};

export function StepCard({
  step,
  canComplete,
  isCompleted,
  onCompletedChange,
}: StepCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(step.promptTemplate);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1600);
  }

  return (
    <Card className="rounded-lg py-5 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Badge variant="outline">Step {step.id}</Badge>
            <span className="text-sm font-medium text-muted-foreground">
              {step.tool}
            </span>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <label className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted has-disabled:cursor-not-allowed has-disabled:opacity-50">
              <input
                type="checkbox"
                checked={isCompleted}
                disabled={!canComplete}
                onChange={(event) => onCompletedChange(event.target.checked)}
                className="size-4 shrink-0 rounded border-input accent-primary"
              />
              Complete
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hover:border-foreground/20"
              onClick={copyPrompt}
            >
              {isCopied ? (
                <Check aria-hidden="true" />
              ) : (
                <Copy aria-hidden="true" />
              )}
              {isCopied ? "Copied" : "Copy prompt"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="hover:bg-muted"
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((current) => !current)}
            >
              {isExpanded ? (
                <ChevronUp aria-hidden="true" />
              ) : (
                <ChevronDown aria-hidden="true" />
              )}
              Details
            </Button>
          </div>
        </div>

        <div className="space-y-2.5">
          <CardTitle className="text-xl leading-tight">{step.title}</CardTitle>
          <CardDescription className="text-base leading-7">
            {step.goal}
          </CardDescription>
          {!canComplete ? (
            <p className="text-sm text-muted-foreground">
              Complete the previous step to unlock this checkbox.
            </p>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="grid gap-5">
        <div className="grid gap-2">
          <h2 className="text-sm font-medium text-foreground">Prompt</h2>
          <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6 text-foreground sm:p-5">
            {step.promptTemplate}
          </p>
        </div>

        {isExpanded ? (
          <div className="grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <h2 className="text-sm font-medium text-foreground">
                Expected output
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {step.expectedOutput}
              </p>
            </div>

            <div className="grid gap-2">
              <h2 className="text-sm font-medium text-foreground">
                Common mistakes
              </h2>
              <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
                {step.commonMistakes.map((mistake) => (
                  <li key={mistake} className="flex gap-2">
                    <span aria-hidden="true">-</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
