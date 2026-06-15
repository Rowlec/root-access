import startupWorkflow from "@/data/startup-workflow.json";
import type { Workflow } from "../../types";

const workflow: Workflow = startupWorkflow;

export function getStartupWorkflow(): Workflow {
  return workflow;
}
