import { track } from "@vercel/analytics";
import { ExternalLink, RotateCcw, Trophy } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GOOGLE_FORM_URL } from "@/constants/links";

type WorkflowCompletionProps = {
  completedCount: number;
  totalSteps: number;
  workflowId: string;
  workflowTitle: string;
  onRestart: () => void;
};

function getCompletionTrackingKey(workflowId: string) {
  return `root-access:workflow-completion-tracked:${workflowId}`;
}

export function WorkflowCompletion({
  completedCount,
  totalSteps,
  workflowId,
  workflowTitle,
  onRestart,
}: WorkflowCompletionProps) {
  useEffect(() => {
    const trackingKey = getCompletionTrackingKey(workflowId);

    try {
      if (window.sessionStorage.getItem(trackingKey) === "true") {
        return;
      }

      window.sessionStorage.setItem(trackingKey, "true");
    } catch {
      // Continue tracking even if sessionStorage is unavailable.
    }

    track("Workflow Completion", {
      workflowTitle,
      completedSteps: completedCount,
      totalSteps,
    });
  }, [completedCount, totalSteps, workflowId, workflowTitle]);

  return (
    <Card className="rounded-lg border-primary/20 bg-muted/40 py-5 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="gap-3">
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Trophy aria-hidden="true" className="size-5" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl">Workflow complete</CardTitle>
          <CardDescription className="text-base leading-7">
            Congratulations. You completed {workflowTitle} and checked off all
            required steps.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          Summary: {completedCount}/{totalSteps} steps completed. Review your
          copied prompts, verify the outputs, and edit everything before using it
          in your assignment.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="h-10 w-full sm:w-auto">
          <a
            href={GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track("Feedback Click", {
                source: "workflow_completion",
              })
            }
          >
            Submit Feedback
            <ExternalLink aria-hidden="true" />
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full sm:w-auto"
          onClick={() => {
            try {
              window.sessionStorage.removeItem(
                getCompletionTrackingKey(workflowId),
              );
            } catch {
              // Nothing to reset when sessionStorage is unavailable.
            }

            onRestart();
          }}
        >
          Restart Workflow
          <RotateCcw aria-hidden="true" />
        </Button>
      </CardFooter>
    </Card>
  );
}
