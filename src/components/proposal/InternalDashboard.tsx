"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

import {
  intelligenceStorageKey,
  parseIntelligenceEvents,
  type IntelligenceEvent,
} from "@/lib/product-intelligence";

const emptySnapshot = "[]";

function countBy<T extends string>(values: T[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function topEntries(counts: Record<string, number>, limit = 5) {
  return Object.entries(counts)
    .sort((first, second) => second[1] - first[1])
    .slice(0, limit);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
}

function subscribeToIntelligence(listener: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === intelligenceStorageKey) {
      listener();
    }
  }

  window.addEventListener("storage", handleStorage);

  return () => window.removeEventListener("storage", handleStorage);
}

function getServerSnapshot() {
  return emptySnapshot;
}

function readIntelligenceSnapshot() {
  try {
    return window.localStorage.getItem(intelligenceStorageKey) ?? emptySnapshot;
  } catch {
    return emptySnapshot;
  }
}

export function InternalDashboard() {
  const t = useTranslations("IntelligenceDashboard");
  const intelligenceSnapshot = useSyncExternalStore(
    subscribeToIntelligence,
    readIntelligenceSnapshot,
    getServerSnapshot,
  );
  const events = useMemo<IntelligenceEvent[]>(
    () => parseIntelligenceEvents(intelligenceSnapshot),
    [intelligenceSnapshot],
  );

  const metrics = useMemo(() => {
    const reviewEvents = events.filter(
      (event) =>
        event.type === "review_completed" || event.type === "retry_completed",
    );
    const retryEvents = events.filter(
      (event) => event.type === "retry_completed",
    );
    const weaknessCounts = countBy(
      reviewEvents.flatMap((event) =>
        (event.weaknesses ?? []).map((weakness) => weakness.toLowerCase()),
      ),
    );
    const failedStepCounts = countBy(
      reviewEvents
        .filter((event) => typeof event.score === "number" && event.score < 24)
        .map((event) => event.sectionTitle),
    );
    const dropOffCounts = countBy(events.map((event) => event.type));
    const retryCounts = countBy(retryEvents.map((event) => event.sectionTitle));
    const improvements = retryEvents
      .map((event) => event.improvement)
      .filter((value): value is number => typeof value === "number");

    return {
      averageImprovement: average(improvements),
      dropOffs: topEntries(dropOffCounts),
      failedSteps: topEntries(failedStepCounts),
      retryCounts: topEntries(retryCounts),
      totalEvents: events.length,
      totalReviews: reviewEvents.length,
      weaknesses: topEntries(weaknessCounts),
    };
  }, [events]);

  function renderList(entries: [string, number][], emptyLabel: string) {
    if (entries.length === 0) {
      return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
    }

    return (
      <ol className="grid gap-2 text-sm leading-6 text-muted-foreground">
        {entries.map(([label, count], index) => (
          <li key={label} className="flex items-start justify-between gap-3">
            <span>
              {index + 1}. {label}
            </span>
            <span className="font-medium text-foreground">{count}</span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <section className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">{t("cards.events")}</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {metrics.totalEvents}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">{t("cards.reviews")}</p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {metrics.totalReviews}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">
            {t("cards.averageImprovement")}
          </p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {metrics.averageImprovement >= 0 ? "+" : ""}
            {metrics.averageImprovement}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            {t("sections.weaknesses")}
          </h2>
          <div className="mt-3">
            {renderList(metrics.weaknesses, t("empty"))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            {t("sections.failedSteps")}
          </h2>
          <div className="mt-3">
            {renderList(metrics.failedSteps, t("empty"))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            {t("sections.dropOffs")}
          </h2>
          <div className="mt-3">{renderList(metrics.dropOffs, t("empty"))}</div>
        </div>
        <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            {t("sections.retries")}
          </h2>
          <div className="mt-3">
            {renderList(metrics.retryCounts, t("empty"))}
          </div>
        </div>
      </div>
    </section>
  );
}
