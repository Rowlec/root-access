import { FeedbackCard } from "@/components/feedback/FeedbackCard";

type FeedbackFormProps = {
  adaptedToolCount?: number;
  availableTools?: string[];
  workflowId?: string;
  workflowRunId?: string;
  workflowTitle?: string;
};

export function FeedbackForm({
  adaptedToolCount,
  availableTools,
  workflowId,
  workflowRunId,
  workflowTitle,
}: FeedbackFormProps) {
  return (
    <FeedbackCard
      adaptedToolCount={adaptedToolCount}
      availableTools={availableTools}
      workflowId={workflowId}
      workflowRunId={workflowRunId}
      workflowTitle={workflowTitle}
    />
  );
}
