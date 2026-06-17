import startupWorkflowEn from "@/data/startup-workflow.json";
import startupWorkflowVi from "@/data/startup-workflow.vi.json";
import {
  defaultLocale,
  isSupportedLocale,
  type Locale,
} from "@/i18n/config";
import type { Workflow } from "../../types";

const workflows = {
  en: startupWorkflowEn,
  vi: startupWorkflowVi,
} satisfies Record<Locale, Workflow>;

export function getStartupWorkflow(locale: string = defaultLocale): Workflow {
  const workflowLocale = isSupportedLocale(locale) ? locale : defaultLocale;

  return workflows[workflowLocale];
}
