"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Compass,
  Lightbulb,
  Route,
  Sparkles,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  onboardingResetEvent,
  onboardingStorageKey,
  onboardingTourStepCount,
} from "@/lib/onboarding";
import { cn } from "@/lib/utils";

type OnboardingProgress = {
  status: "complete" | "tour" | "welcome";
  step: number;
};

type SpotlightRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type TourStep = {
  body: string;
  helper: string;
  id: string;
  route: "/" | "/result";
  targets: string[];
  title: string;
};

function readProgress(): OnboardingProgress {
  try {
    const storedValue = window.localStorage.getItem(onboardingStorageKey);

    if (!storedValue) {
      return { status: "welcome", step: 0 };
    }

    const parsed: unknown = JSON.parse(storedValue);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("status" in parsed) ||
      !("step" in parsed)
    ) {
      return { status: "welcome", step: 0 };
    }

    const status = (parsed as { status?: unknown }).status;
    const step = (parsed as { step?: unknown }).step;

    if (
      (status !== "complete" && status !== "tour" && status !== "welcome") ||
      typeof step !== "number" ||
      !Number.isInteger(step) ||
      step < 0 ||
      step >= onboardingTourStepCount
    ) {
      return { status: "welcome", step: 0 };
    }

    return { status, step };
  } catch {
    return { status: "welcome", step: 0 };
  }
}

function writeProgress(progress: OnboardingProgress) {
  try {
    window.localStorage.setItem(onboardingStorageKey, JSON.stringify(progress));
  } catch {
    return;
  }
}

export function ProductOnboarding() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Onboarding");
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [viewport, setViewport] = useState({ height: 0, width: 0 });
  const tourDialogRef = useRef<HTMLDivElement>(null);
  const tourSteps = useMemo<TourStep[]>(
    () => [
      {
        body: t("tour.steps.projectForm.body"),
        helper: t("tour.steps.projectForm.helper"),
        id: "project-form",
        route: "/",
        targets: ['[data-onboarding="project-form"]'],
        title: t("tour.steps.projectForm.title"),
      },
      {
        body: t("tour.steps.generateWorkflow.body"),
        helper: t("tour.steps.generateWorkflow.helper"),
        id: "generate-workflow",
        route: "/",
        targets: ['[data-onboarding="generate-workflow"]'],
        title: t("tour.steps.generateWorkflow.title"),
      },
      {
        body: t("tour.steps.workspace.body"),
        helper: t("tour.steps.workspace.helper"),
        id: "workspace",
        route: "/result",
        targets: ['[data-onboarding="ai-workspace"]'],
        title: t("tour.steps.workspace.title"),
      },
      {
        body: t("tour.steps.review.body"),
        helper: t("tour.steps.review.helper"),
        id: "review",
        route: "/result",
        targets: ['[data-onboarding="review-entry"]'],
        title: t("tour.steps.review.title"),
      },
      {
        body: t("tour.steps.improve.body"),
        helper: t("tour.steps.improve.helper"),
        id: "improve",
        route: "/result",
        targets: [
          '[data-onboarding="improve-result"]',
          '[data-onboarding="improve-guide"]',
        ],
        title: t("tour.steps.improve.title"),
      },
      {
        body: t("tour.steps.export.body"),
        helper: t("tour.steps.export.helper"),
        id: "export",
        route: "/result",
        targets: ['[data-onboarding="export"]'],
        title: t("tour.steps.export.title"),
      },
    ],
    [t],
  );
  const activeStep = progress?.status === "tour" ? tourSteps[progress.step] : null;
  const activeTargetSelectors = activeStep?.targets.join("||") ?? "";
  const isTourVisible = Boolean(activeStep && activeStep.route === pathname);
  const isWaitingForWorkspace = Boolean(
    progress?.status === "tour" && progress.step === 2 && pathname === "/",
  );

  function persistProgress(nextProgress: OnboardingProgress) {
    writeProgress(nextProgress);
    setProgress(nextProgress);
  }

  function completeOnboarding() {
    persistProgress({ status: "complete", step: tourSteps.length - 1 });
  }

  function startTour() {
    const firstStep = pathname === "/result" ? 2 : 0;
    const nextProgress: OnboardingProgress = {
      status: "tour",
      step: firstStep,
    };

    persistProgress(nextProgress);

    if (pathname !== "/" && pathname !== "/result") {
      persistProgress({ status: "tour", step: 0 });
      router.push("/#goal-form");
    }
  }

  function showForm() {
    document.querySelector("#goal-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("#startupIdea")?.focus();
    });
  }

  function goToStep(step: number) {
    const boundedStep = Math.max(0, Math.min(step, tourSteps.length - 1));
    const nextStep = tourSteps[boundedStep];

    persistProgress({ status: "tour", step: boundedStep });

    if (nextStep.route === pathname) {
      return;
    }

    if (nextStep.route === "/") {
      router.push("/#goal-form");
    }
  }

  function handleNext() {
    if (!progress || progress.status !== "tour") {
      return;
    }

    if (progress.step >= tourSteps.length - 1) {
      completeOnboarding();
      return;
    }

    const nextStep = progress.step + 1;

    if (nextStep === 2 && pathname === "/") {
      persistProgress({ status: "tour", step: nextStep });
      window.requestAnimationFrame(showForm);
      return;
    }

    goToStep(nextStep);
  }

  useEffect(() => {
    const syncProgress = () => setProgress(readProgress());
    const resetOnboarding = () => {
      const nextProgress: OnboardingProgress = {
        status: "welcome",
        step: pathname === "/result" ? 2 : 0,
      };

      writeProgress(nextProgress);
      setProgress(nextProgress);
    };
    const syncTimer = window.setTimeout(syncProgress, 0);

    window.addEventListener(onboardingResetEvent, resetOnboarding);

    return () => {
      window.clearTimeout(syncTimer);
      window.removeEventListener(onboardingResetEvent, resetOnboarding);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isTourVisible || !activeTargetSelectors) {
      return;
    }

    let animationFrame = 0;
    let targetElement: HTMLElement | null = null;
    const targetSelectors = activeTargetSelectors.split("||");

    const updateSpotlight = () => {
      if (!targetElement) {
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      const padding = 10;

      setSpotlightRect({
        height: rect.height + padding * 2,
        left: Math.max(8, rect.left - padding),
        top: Math.max(8, rect.top - padding),
        width: Math.min(window.innerWidth - 16, rect.width + padding * 2),
      });
      setViewport({ height: window.innerHeight, width: window.innerWidth });
    };
    const findTarget = () => {
      targetElement =
        targetSelectors
          .map((selector) => document.querySelector<HTMLElement>(selector))
          .find(Boolean) ?? null;

      if (!targetElement) {
        setSpotlightRect(null);
        setViewport({ height: window.innerHeight, width: window.innerWidth });
        return;
      }

      if (window.innerWidth < 640) {
        const targetRect = targetElement.getBoundingClientRect();
        const targetTop = window.scrollY + targetRect.top;

        window.scrollTo({
          behavior: "smooth",
          top: Math.max(0, targetTop - 140),
        });
      } else {
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      animationFrame = window.requestAnimationFrame(updateSpotlight);
    };
    const targetTimer = window.setTimeout(findTarget, 120);

    window.addEventListener("resize", updateSpotlight);
    window.addEventListener("scroll", updateSpotlight, true);

    return () => {
      window.clearTimeout(targetTimer);
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateSpotlight);
      window.removeEventListener("scroll", updateSpotlight, true);
    };
  }, [activeTargetSelectors, isTourVisible]);

  useEffect(() => {
    if (!isTourVisible && progress?.status !== "welcome") {
      return;
    }

    const focusTimer = window.setTimeout(() => tourDialogRef.current?.focus(), 80);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        completeOnboarding();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  const tourCardStyle = useMemo<CSSProperties | undefined>(() => {
    if (viewport.width < 640) {
      return undefined;
    }

    const cardWidth = 380;
    const cardHeight = 380;
    const gap = 16;

    if (!spotlightRect) {
      return {
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: cardWidth,
      };
    }

    const spaceBelow = viewport.height - (spotlightRect.top + spotlightRect.height);
    const spaceAbove = spotlightRect.top;
    const spaceLeft = spotlightRect.left;
    const spaceRight =
      viewport.width - (spotlightRect.left + spotlightRect.width);
    const maxTop = Math.max(gap, viewport.height - cardHeight - gap);
    const alignedTop = Math.min(Math.max(gap, spotlightRect.top), maxTop);
    let left = Math.min(
      Math.max(gap, spotlightRect.left),
      Math.max(gap, viewport.width - cardWidth - gap),
    );
    let top = alignedTop;

    if (spaceBelow >= cardHeight + gap) {
      top = spotlightRect.top + spotlightRect.height + gap;
    } else if (spaceAbove >= cardHeight + gap) {
      top = spotlightRect.top - cardHeight - gap;
    } else if (spaceLeft >= cardWidth + gap * 2) {
      left = spotlightRect.left - cardWidth - gap;
    } else if (spaceRight >= cardWidth + gap * 2) {
      left = spotlightRect.left + spotlightRect.width + gap;
    }

    return { left, top, width: cardWidth };
  }, [spotlightRect, viewport]);

  if (!progress || progress.status === "complete") {
    return null;
  }

  if (progress.status === "welcome") {
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center overflow-x-hidden bg-background/85 p-4 backdrop-blur-md">
        <div
          ref={tourDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-welcome-title"
          tabIndex={-1}
          className="glass onboarding-enter max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] min-w-0 max-w-2xl overflow-x-hidden overflow-y-auto rounded-3xl p-5 outline-none sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="secondary" className="gap-1.5">
                <Sparkles aria-hidden="true" className="size-3.5" />
                {t("welcome.badge")}
              </Badge>
              <h2
                id="onboarding-welcome-title"
                className="max-w-xl text-2xl font-semibold leading-tight text-foreground sm:text-3xl"
              >
                {t("welcome.title")}
              </h2>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                {t("welcome.description")}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full"
              aria-label={t("actions.skip")}
              title={t("actions.skip")}
              onClick={completeOnboarding}
            >
              <X aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3">
              <Compass aria-hidden="true" className="size-5 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">
                {t("welcome.accomplishTitle")}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("welcome.accomplishBody")}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3">
              <Clock3 aria-hidden="true" className="size-5 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">
                {t("welcome.timeTitle")}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("welcome.timeBody")}
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3">
              <Route aria-hidden="true" className="size-5 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">
                {t("welcome.workflowTitle")}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("welcome.workflowBody")}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="btn-glass h-11 rounded-full px-5"
              onClick={completeOnboarding}
            >
              {t("actions.skip")}
            </Button>
            <Button
              type="button"
              className="btn-liquid btn-action h-11 rounded-full px-5 text-primary-foreground"
              onClick={startTour}
            >
              {t("actions.start")}
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isWaitingForWorkspace) {
    return (
      <div className="onboarding-enter fixed inset-x-4 bottom-4 z-[90] ml-auto max-w-md rounded-2xl border border-primary/35 bg-background/95 p-4 shadow-2xl backdrop-blur-xl sm:left-auto">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Check aria-hidden="true" className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{t("waiting.title")}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("waiting.body")}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-full"
            onClick={completeOnboarding}
          >
            {t("actions.skip")}
          </Button>
          <Button
            type="button"
            className="btn-liquid h-9 rounded-full px-4 text-primary-foreground"
            onClick={showForm}
          >
            {t("actions.goToForm")}
          </Button>
        </div>
      </div>
    );
  }

  if (!isTourVisible || !activeStep) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-[70]" aria-hidden="true" />
      {spotlightRect ? (
        <div
          aria-hidden="true"
          className="onboarding-spotlight pointer-events-none fixed z-[75] rounded-3xl border-2 border-primary"
          style={spotlightRect}
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 z-[74] bg-background/75 backdrop-blur-sm" />
      )}
      <div
        ref={tourDialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-tour-title"
        tabIndex={-1}
        className={cn(
          "glass onboarding-enter fixed z-[80] max-h-[calc(100svh-2rem)] overflow-y-auto rounded-3xl p-4 outline-none sm:p-5",
          "inset-x-4 bottom-4 sm:inset-x-auto sm:bottom-auto",
        )}
        style={tourCardStyle}
      >
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary">
            {t("tour.progress", {
              current: progress.step + 1,
              total: tourSteps.length,
            })}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={completeOnboarding}
          >
            {t("actions.skip")}
          </Button>
        </div>

        <div className="mt-4">
          <h2 id="onboarding-tour-title" className="text-xl font-semibold text-foreground">
            {activeStep.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {activeStep.body}
          </p>
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm leading-6 text-muted-foreground">
            <Lightbulb aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
            <p>{activeStep.helper}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-1.5" aria-hidden="true">
          {tourSteps.map((step, index) => (
            <span
              key={step.id}
              className={cn(
                "h-1.5 flex-1 rounded-full bg-secondary transition-colors duration-300",
                index <= progress.step && "bg-primary",
              )}
            />
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            className="btn-glass h-10 rounded-full px-4"
            disabled={progress.step === 0}
            onClick={() => goToStep(progress.step - 1)}
          >
            <ArrowLeft aria-hidden="true" />
            {t("actions.back")}
          </Button>
          <Button
            type="button"
            className="btn-liquid h-10 rounded-full px-4 text-primary-foreground"
            onClick={handleNext}
          >
            {progress.step === tourSteps.length - 1
              ? t("actions.finish")
              : progress.step === 1
                ? t("actions.continueInForm")
                : t("actions.next")}
            {progress.step === tourSteps.length - 1 ? (
              <Check aria-hidden="true" />
            ) : (
              <ArrowRight aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
