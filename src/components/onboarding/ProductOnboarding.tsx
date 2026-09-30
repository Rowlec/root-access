"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Compass,
  Download,
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

type OnboardingProgress = {
  status: "complete" | "tour" | "welcome";
  step: number;
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
  const router = useRouter();
  const t = useTranslations("Onboarding");
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const tourDialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProgress(readProgress());

    const resetOnboarding = () => {
      const nextProgress: OnboardingProgress = {
        status: "welcome",
        step: 0,
      };

      writeProgress(nextProgress);
      setProgress(nextProgress);
    };

    window.addEventListener(onboardingResetEvent, resetOnboarding);

    return () => {
      window.removeEventListener(onboardingResetEvent, resetOnboarding);
    };
  }, []);

  function persistProgress(nextProgress: OnboardingProgress) {
    writeProgress(nextProgress);
    setProgress(nextProgress);
  }

  function completeOnboarding() {
    persistProgress({ status: "complete", step: onboardingTourStepCount - 1 });
  }

  function startTour() {
    persistProgress({ status: "tour", step: 0 });
  }

  function goToExtension() {
    completeOnboarding();
    router.push("/connect-extension");
  }

  // Keyboard accessibility
  useEffect(() => {
    if (!progress || progress.status === "complete") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        completeOnboarding();
      } else if (progress.status === "tour") {
        if (e.key === "ArrowRight" && progress.step < onboardingTourStepCount - 1) {
          persistProgress({ status: "tour", step: progress.step + 1 });
        } else if (e.key === "ArrowLeft" && progress.step > 0) {
          persistProgress({ status: "tour", step: progress.step - 1 });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [progress]);

  if (!progress || progress.status === "complete") {
    return null;
  }

  const tourSteps = [
    {
      icon: Download,
      title: t("tour.steps.step1.title"),
      body: t("tour.steps.step1.body"),
      helper: t("tour.steps.step1.helper"),
      color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    },
    {
      icon: Bot,
      title: t("tour.steps.step2.title"),
      body: t("tour.steps.step2.body"),
      helper: t("tour.steps.step2.helper"),
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    },
    {
      icon: CheckCircle2,
      title: t("tour.steps.step3.title"),
      body: t("tour.steps.step3.body"),
      helper: t("tour.steps.step3.helper"),
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    },
  ];

  // 1. Màn hình Chào mừng (Welcome)
  if (progress.status === "welcome") {
    return (
      <div className="fixed inset-0 z-[100] grid place-items-center overflow-x-hidden bg-background/85 p-4 backdrop-blur-md">
        <div
          ref={tourDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-welcome-title"
          tabIndex={-1}
          className="glass onboarding-enter max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] min-w-0 max-w-2xl overflow-x-hidden overflow-y-auto rounded-3xl p-5 outline-none sm:p-7 shadow-2xl border border-border/80"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                <Sparkles aria-hidden="true" className="size-3.5 text-primary" />
                {t("welcome.badge")}
              </Badge>
              <h2
                id="onboarding-welcome-title"
                className="max-w-xl text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
              >
                {t("welcome.title")}
              </h2>
              <p className="max-w-xl text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {t("welcome.description")}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
              aria-label={t("actions.skip")}
              title={t("actions.skip")}
              onClick={completeOnboarding}
            >
              <X aria-hidden="true" className="size-5" />
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Compass aria-hidden="true" className="size-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {t("welcome.accomplishTitle")}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("welcome.accomplishBody")}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <Sparkles aria-hidden="true" className="size-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {t("welcome.timeTitle")}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("welcome.timeBody")}
              </p>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Route aria-hidden="true" className="size-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {t("welcome.workflowTitle")}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("welcome.workflowBody")}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-2xl px-5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={completeOnboarding}
            >
              {t("actions.skip")}
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="h-11 w-full sm:w-auto rounded-2xl px-5 text-xs font-semibold"
                onClick={startTour}
              >
                {t("actions.start")}
                <ArrowRight aria-hidden="true" className="ml-1.5 size-4" />
              </Button>
              <Button
                type="button"
                className="h-11 w-full sm:w-auto rounded-2xl px-6 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25"
                onClick={goToExtension}
              >
                <Download aria-hidden="true" className="mr-1.5 size-4" />
                {t("actions.installNow")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Màn hình Tour 3 bước trực quan (Interactive Step Guide)
  const currentStepData = tourSteps[progress.step] ?? tourSteps[0];
  const StepIcon = currentStepData.icon;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-x-hidden bg-background/85 p-4 backdrop-blur-md">
      <div
        ref={tourDialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-step-title"
        tabIndex={-1}
        className="glass onboarding-enter max-h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] min-w-0 max-w-xl overflow-x-hidden overflow-y-auto rounded-3xl p-6 outline-none sm:p-8 shadow-2xl border border-border/80 space-y-6"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs px-2.5 py-0.5">
              {t("tour.progress", { current: progress.step + 1, total: onboardingTourStepCount })}
            </Badge>
            <div className="flex gap-1.5 ml-2">
              {tourSteps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Bước ${i + 1}`}
                  onClick={() => persistProgress({ status: "tour", step: i })}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === progress.step
                      ? "w-6 bg-primary"
                      : i < progress.step
                        ? "w-3 bg-primary/50"
                        : "w-3 bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-foreground"
            onClick={completeOnboarding}
          >
            <X className="size-5" />
          </Button>
        </div>

        <div className="space-y-4 py-2">
          <div className={`inline-flex items-center justify-center p-3.5 rounded-2xl border ${currentStepData.color}`}>
            <StepIcon className="size-8" />
          </div>

          <div className="space-y-2">
            <h3
              id="onboarding-step-title"
              className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
            >
              {currentStepData.title}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              {currentStepData.body}
            </p>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-primary-foreground/90">
            <span className="font-semibold text-primary block mb-1">Mẹo thực hiện:</span>
            {currentStepData.helper}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/60">
          {progress.step > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl px-4 text-xs font-semibold"
              onClick={() => persistProgress({ status: "tour", step: progress.step - 1 })}
            >
              <ArrowLeft className="mr-1.5 size-4" />
              {t("actions.back")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-xl px-4 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => persistProgress({ status: "welcome", step: 0 })}
            >
              {t("actions.back")}
            </Button>
          )}

          <div className="flex items-center gap-2">
            {progress.step < onboardingTourStepCount - 1 ? (
              <Button
                type="button"
                className="h-10 rounded-xl px-5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => persistProgress({ status: "tour", step: progress.step + 1 })}
              >
                {t("actions.next")}
                <ArrowRight className="ml-1.5 size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="h-10 rounded-xl px-5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25"
                onClick={goToExtension}
              >
                <Download className="mr-1.5 size-4" />
                {t("actions.finish")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
