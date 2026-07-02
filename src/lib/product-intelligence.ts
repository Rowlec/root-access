import type { ProposalSectionId } from "@/lib/proposal-review";

export const intelligenceStorageKey = "root-access:intelligence:v1";

export type IntelligenceEventType =
  | "output_pasted"
  | "review_completed"
  | "retry_completed"
  | "section_completed";

export type IntelligenceEvent = {
  createdAt: string;
  id: string;
  improvement?: number;
  previousScore?: number;
  promptLabel?: string;
  score?: number;
  sectionId: ProposalSectionId;
  sectionTitle: string;
  type: IntelligenceEventType;
  weaknesses?: string[];
  workflowRunId: string;
};

export function parseIntelligenceEvents(value: string | null) {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((event): event is IntelligenceEvent => {
      if (!event || typeof event !== "object" || Array.isArray(event)) {
        return false;
      }

      const candidate = event as Partial<IntelligenceEvent>;

      return (
        typeof candidate.id === "string" &&
        typeof candidate.createdAt === "string" &&
        typeof candidate.workflowRunId === "string" &&
        typeof candidate.sectionId === "string" &&
        typeof candidate.sectionTitle === "string" &&
        typeof candidate.type === "string"
      );
    });
  } catch {
    return [];
  }
}
