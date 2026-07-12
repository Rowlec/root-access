"use client";

import { Check, ChevronRight, FileText, RefreshCw, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const proposalSectionIds = [
  "idea",
  "problem",
  "customer",
  "market",
  "solution",
  "revenue",
  "competition",
  "mvp",
  "validation",
] as const;

type ProposalSectionId = (typeof proposalSectionIds)[number];

type BuilderDocument = {
  sections: Record<ProposalSectionId, BuilderSectionState>;
};

type BuilderSectionState = {
  content: string;
  isManual: boolean;
  sourceContent: string;
  updatedAt: string | null;
};

type ProposalBuilderProps = {
  sources: Record<ProposalSectionId, string>;
  workflowRunId: string;
};

const emptySectionState: BuilderSectionState = {
  content: "",
  isManual: false,
  sourceContent: "",
  updatedAt: null,
};

function getStorageKey(workflowRunId: string) {
  return `root-access:proposal-builder:${workflowRunId}`;
}

function createEmptyDocument(): BuilderDocument {
  return {
    sections: Object.fromEntries(
      proposalSectionIds.map((sectionId) => [sectionId, { ...emptySectionState }]),
    ) as BuilderDocument["sections"],
  };
}

function readDocument(workflowRunId: string): BuilderDocument {
  try {
    const storedValue = window.localStorage.getItem(getStorageKey(workflowRunId));

    if (!storedValue) {
      return createEmptyDocument();
    }

    const parsed: unknown = JSON.parse(storedValue);

    if (!parsed || typeof parsed !== "object" || !("sections" in parsed)) {
      return createEmptyDocument();
    }

    const storedSections = (parsed as { sections?: unknown }).sections;

    if (!storedSections || typeof storedSections !== "object") {
      return createEmptyDocument();
    }

    return {
      sections: Object.fromEntries(
        proposalSectionIds.map((sectionId) => {
          const storedSection = (storedSections as Record<string, unknown>)[
            sectionId
          ];
          const value =
            storedSection && typeof storedSection === "object"
              ? (storedSection as Partial<BuilderSectionState>)
              : {};

          return [
            sectionId,
            {
              content: typeof value.content === "string" ? value.content : "",
              isManual: value.isManual === true,
              sourceContent:
                typeof value.sourceContent === "string" ? value.sourceContent : "",
              updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
            },
          ];
        }),
      ) as BuilderDocument["sections"],
    };
  } catch {
    return createEmptyDocument();
  }
}

function isComplete(content: string) {
  return content.trim().length > 0;
}

export function ProposalBuilder({ sources, workflowRunId }: ProposalBuilderProps) {
  const t = useTranslations("ProposalBuilder");
  const [proposalDocument, setProposalDocument] =
    useState<BuilderDocument>(createEmptyDocument);
  const [hydratedRunId, setHydratedRunId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] =
    useState<ProposalSectionId>("idea");
  const sourceSignature = useMemo(() => JSON.stringify(sources), [sources]);
  const isHydrated = hydratedRunId === workflowRunId;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProposalDocument(readDocument(workflowRunId));
      setHydratedRunId(workflowRunId);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [workflowRunId]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const timer = window.setTimeout(() => {
      setProposalDocument((currentDocument) => {
        const nextSections = { ...currentDocument.sections };
        let changed = false;

        proposalSectionIds.forEach((sectionId) => {
          const currentSection = currentDocument.sections[sectionId];
          const sourceContent = sources[sectionId].trim();

          if (
            currentSection.isManual ||
            (currentSection.sourceContent === sourceContent &&
              currentSection.content === sourceContent)
          ) {
            return;
          }

          nextSections[sectionId] = {
            content: sourceContent,
            isManual: false,
            sourceContent,
            updatedAt: sourceContent ? new Date().toISOString() : null,
          };
          changed = true;
        });

        return changed ? { sections: nextSections } : currentDocument;
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isHydrated, sourceSignature, sources]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        getStorageKey(workflowRunId),
        JSON.stringify(proposalDocument),
      );
    } catch {
      return;
    }
  }, [isHydrated, proposalDocument, workflowRunId]);

  const completedCount = proposalSectionIds.filter((sectionId) =>
    isComplete(proposalDocument.sections[sectionId].content),
  ).length;
  const completionPercentage = Math.round(
    (completedCount / proposalSectionIds.length) * 100,
  );
  const firstIncompleteSectionId = proposalSectionIds.find(
    (sectionId) => !isComplete(proposalDocument.sections[sectionId].content),
  );
  const activeSection = proposalDocument.sections[activeSectionId];

  function updateSection(content: string) {
    setProposalDocument((currentDocument) => ({
      sections: {
        ...currentDocument.sections,
        [activeSectionId]: {
          ...currentDocument.sections[activeSectionId],
          content,
          isManual: true,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  }

  function syncActiveSection() {
    const sourceContent = sources[activeSectionId].trim();

    setProposalDocument((currentDocument) => ({
      sections: {
        ...currentDocument.sections,
        [activeSectionId]: {
          content: sourceContent,
          isManual: false,
          sourceContent,
          updatedAt: sourceContent ? new Date().toISOString() : null,
        },
      },
    }));
  }

  function jumpToFirstIncomplete() {
    if (!firstIncompleteSectionId) {
      return;
    }

    setActiveSectionId(firstIncompleteSectionId);
    window.setTimeout(() => {
      document
        .querySelector('[data-proposal-builder-editor="true"]')
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  return (
    <section
      data-proposal-builder="true"
      className="glass grid gap-5 rounded-3xl p-4 sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <Badge variant="secondary" className="gap-1.5">
            <FileText aria-hidden="true" className="size-3.5" />
            {t("live.badge")}
          </Badge>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">
            {t("live.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("live.description")}
          </p>
        </div>
        <div className="min-w-52 rounded-2xl border border-border/70 bg-secondary/25 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">
              {t("live.progress")}
            </p>
            <p className="text-sm font-semibold text-primary">
              {completedCount}/{proposalSectionIds.length}
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/45">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <Button
            type="button"
            data-proposal-builder-jump="true"
            variant="outline"
            size="sm"
            className="btn-glass mt-3 w-full justify-center rounded-full"
            disabled={!firstIncompleteSectionId}
            onClick={jumpToFirstIncomplete}
          >
            <ChevronRight aria-hidden="true" />
            {t("live.jumpToIncomplete")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav
          aria-label={t("live.sectionsLabel")}
          className="grid grid-cols-2 gap-1 rounded-2xl border border-border/70 bg-secondary/20 p-2 lg:grid-cols-1"
        >
          {proposalSectionIds.map((sectionId) => {
            const section = proposalDocument.sections[sectionId];
            const completed = isComplete(section.content);
            const isActive = sectionId === activeSectionId;

            return (
              <button
                key={sectionId}
                type="button"
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:bg-background/40 hover:text-foreground",
                )}
                onClick={() => setActiveSectionId(sectionId)}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border",
                    completed
                      ? "border-emerald-400 bg-emerald-400/15 text-emerald-300"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {completed ? <Check aria-hidden="true" className="size-3" /> : null}
                </span>
                <span className="min-w-0 flex-1 font-medium">{t(`live.sections.${sectionId}`)}</span>
                {section.isManual ? (
                  <span className="text-xs text-primary">{t("live.edited")}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div
          data-proposal-builder-editor="true"
          className="grid gap-3 rounded-2xl border border-border/70 bg-background/25 p-3 sm:p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-foreground">
                {t(`live.sections.${activeSectionId}`)}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t(`live.sectionDescriptions.${activeSectionId}`)}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Save aria-hidden="true" className="size-3.5 text-primary" />
              {t("live.autosaved")}
            </div>
          </div>

          <Textarea
            aria-label={t(`live.sections.${activeSectionId}`)}
            className="min-h-80 resize-y rounded-2xl bg-background/45 text-sm leading-6 text-foreground"
            placeholder={t("live.emptySection")}
            value={activeSection.content}
            onChange={(event) => updateSection(event.target.value)}
          />

          <div className="flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted-foreground">
              {activeSection.isManual
                ? t("live.manualHint")
                : t("live.syncedHint")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="btn-glass justify-center rounded-full"
              disabled={!sources[activeSectionId].trim()}
              onClick={syncActiveSection}
            >
              <RefreshCw aria-hidden="true" />
              {t("live.useLatestOutput")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
