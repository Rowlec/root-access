"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { track } from "@vercel/analytics";
import { ArrowRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ContextualHelper } from "@/components/onboarding/ContextualHelper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { goalFormSchema, type GoalFormValues } from "@/lib/goal-form-schema";

const goalContextStorageKey = "root-access:startup-context";
const descriptionHeightClasses = {
  default: "min-h-6",
  paired: "min-h-6 sm:min-h-12",
} as const;

type FormFieldProps = {
  children: ReactNode;
  description?: string;
  descriptionHeight?: keyof typeof descriptionHeightClasses;
  error?: string;
  id: string;
  label: string;
};

function FormField({
  children,
  description,
  descriptionHeight = "default",
  error,
  id,
  label,
}: FormFieldProps) {
  return (
    <div className="grid h-full content-start gap-2.5">
      <label
        htmlFor={id}
        className="min-h-5 text-sm font-medium leading-5 text-foreground"
      >
        {label}
      </label>
      <p
        className={cn(
          descriptionHeightClasses[descriptionHeight],
          "text-sm leading-6 text-muted-foreground",
        )}
      >
        {description}
      </p>
      <div className="grid">{children}</div>
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

function readStoredGoalContext() {
  try {
    const storedValue = window.localStorage.getItem(goalContextStorageKey);

    if (!storedValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    const parsedContext = goalFormSchema.safeParse(parsedValue);

    if (!parsedContext.success) {
      window.localStorage.removeItem(goalContextStorageKey);
      return null;
    }

    return parsedContext.data;
  } catch {
    return null;
  }
}

function writeStoredGoalContext(values: GoalFormValues) {
  try {
    window.localStorage.setItem(goalContextStorageKey, JSON.stringify(values));
  } catch {
    return;
  }
}

export function GoalForm() {
  const router = useRouter();
  const t = useTranslations("GoalForm");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      workflowMode: "deep",
      currentStage: "No clear idea yet",
      startupIdea: "",
      industry: "",
      targetCustomer: "",
      deadlineUrgency: "No deadline",
      availableTools: ["Gemini"],
    },
  });

  useEffect(() => {
    const storedGoalContext = readStoredGoalContext();

    if (storedGoalContext) {
      setValue("workflowMode", storedGoalContext.workflowMode, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
      setValue("currentStage", storedGoalContext.currentStage, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
      setValue("startupIdea", storedGoalContext.startupIdea, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
      setValue("industry", storedGoalContext.industry, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
      setValue("targetCustomer", storedGoalContext.targetCustomer, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
      setValue("deadlineUrgency", storedGoalContext.deadlineUrgency, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
      setValue("availableTools", storedGoalContext.availableTools, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
      return;
    }

  }, [setValue]);

  function onSubmit(values: GoalFormValues) {
    writeStoredGoalContext(values);

    track("Workflow Start", {
      industry: values.industry,
    });

    // Project context remains in browser storage and is not put into the URL.
    router.push("/result");
  }

  return (
    <section id="goal-form" className="w-full py-16 sm:py-24">
      <div className="mx-auto grid w-full max-w-6xl items-start gap-8 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12 lg:px-10">
        <div className="max-w-xl space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            {t("eyebrow")}
          </p>
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl sm:leading-[1.15]">
            {t("title")}
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <Card className="glass rounded-3xl py-6 shadow-none">
          <CardHeader data-onboarding="project-form" className="gap-2">
            <CardTitle className="text-xl">{t("cardTitle")}</CardTitle>
            <CardDescription className="leading-6">
              {t("cardDescription")}
            </CardDescription>
            </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
              <ContextualHelper>{t("contextualTip")}</ContextualHelper>

              <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
                <p className="text-sm font-medium text-foreground">
                  {t("workflowChoice.title")}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t("workflowChoice.description")}
                </p>
              </div>

              <FormField
                id="startupIdea"
                label={t("fields.startupIdea.label")}
                error={
                  errors.startupIdea
                    ? t("fields.startupIdea.error")
                    : undefined
                }
              >
                <Textarea
                  id="startupIdea"
                  placeholder={t("fields.startupIdea.placeholder")}
                  className="min-h-28 resize-none"
                  aria-invalid={Boolean(errors.startupIdea)}
                  {...register("startupIdea")}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="industry"
                  label={t("fields.industry.label")}
                  description={t("fields.industry.description")}
                  descriptionHeight="paired"
                  error={
                    errors.industry ? t("fields.industry.error") : undefined
                  }
                >
                  <Input
                    id="industry"
                    className="h-10"
                    placeholder={t("fields.industry.placeholder")}
                    aria-invalid={Boolean(errors.industry)}
                    {...register("industry")}
                  />
                </FormField>

                <FormField
                  id="targetCustomer"
                  label={t("fields.targetCustomer.label")}
                  description={t("fields.targetCustomer.description")}
                  descriptionHeight="paired"
                >
                  <Input
                    id="targetCustomer"
                    className="h-10"
                    placeholder={t("fields.targetCustomer.placeholder")}
                    {...register("targetCustomer")}
                  />
                </FormField>

              </div>

              <Button
                data-onboarding="generate-workflow"
                type="submit"
                size="lg"
                className="btn-liquid mt-1 h-12 w-full rounded-full text-base font-semibold text-primary-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 aria-hidden="true" className="animate-spin" />
                ) : (
                  <ArrowRight aria-hidden="true" />
                )}
                {isSubmitting ? t("actions.submitting") : t("actions.submit")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
