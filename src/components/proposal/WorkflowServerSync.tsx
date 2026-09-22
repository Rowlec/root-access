"use client";

import { useEffect } from "react";

export function WorkflowServerSync({ workflowRunId }: { workflowRunId: string }) {
  useEffect(() => {
    const projectId = window.localStorage.getItem("root-access:active-project-id");

    if (!projectId) return;

    const sync = () => {
      const workspaceValue = window.localStorage.getItem(
        `root-access:workflow-review:${workflowRunId}`,
      );
      const builderValue = window.localStorage.getItem(
        `root-access:proposal-builder:${workflowRunId}`,
      );

      let workspace: Record<string, unknown> | null = null;
      let builder: Record<string, unknown> | null = null;

      try {
        workspace = workspaceValue ? JSON.parse(workspaceValue) : null;
        builder = builderValue ? JSON.parse(builderValue) : null;
      } catch {
        return;
      }

      if (!workspace && !builder) return;

      void fetch(`/api/projects/${projectId}/workflow`, {
        body: JSON.stringify({ builder, workspace }),
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        method: "PUT",
      });
    };

    const interval = window.setInterval(sync, 5_000);
    window.addEventListener("pagehide", sync);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pagehide", sync);
      sync();
    };
  }, [workflowRunId]);

  return null;
}
