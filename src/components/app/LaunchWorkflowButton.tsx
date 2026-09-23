"use client";

import { useRouter } from "next/navigation";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LaunchWorkflowButton({
  project,
}: {
  project: {
    id: string;
    industry: string;
    startupIdea: string;
    targetCustomer: string;
  };
}) {
  const router = useRouter();

  async function launch() {
    window.localStorage.setItem(
      "root-access:startup-context",
      JSON.stringify({
        availableTools: ["Gemini"],
        currentStage: "No clear idea yet",
        deadlineUrgency: "No deadline",
        industry: project.industry,
        startupIdea: project.startupIdea,
        targetCustomer: project.targetCustomer,
        workflowMode: "deep",
      }),
    );
    window.localStorage.setItem("root-access:active-project-id", project.id);

    try {
      const response = await fetch(`/api/projects/${project.id}/workflow`);
      if (response.ok) {
        const saved = (await response.json()) as {
          builder: Record<string, unknown> | null;
          workspace: Record<string, unknown> | null;
        };
        const locale = document.documentElement.lang === "vi" ? "vi" : "en";
        const source = JSON.stringify({
          idea: project.startupIdea,
          industry: project.industry,
          locale,
          targetCustomer: project.targetCustomer,
        });
        let hash = 0;
        for (let index = 0; index < source.length; index += 1) {
          hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
        }
        const runId = hash.toString(36);
        if (saved.workspace) {
          window.localStorage.setItem(
            `root-access:workflow-review:${runId}`,
            JSON.stringify(saved.workspace),
          );
        }
        if (saved.builder) {
          window.localStorage.setItem(
            `root-access:proposal-builder:${runId}`,
            JSON.stringify(saved.builder),
          );
        }
      }
    } catch {
      // The local workflow remains usable if server restoration is unavailable.
    }
    router.push(`/app/projects/${project.id}/workflow/problem/generate`);
  }

  return (
    <Button onClick={launch} className="btn-liquid h-11">
      <Play /> Tiếp tục guided workflow
    </Button>
  );
}
