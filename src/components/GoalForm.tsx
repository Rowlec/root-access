"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { track } from "@vercel/analytics";
import { ArrowRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  availableToolOptions,
  availableToolsSchema,
  deadlineUrgencyOptions,
  goalFormSchema,
  type GoalFormValues,
} from "@/lib/goal-form-schema";
import {
  formatAnalyticsTools,
  getUniqueAnalyticsTools,
} from "@/lib/analytics-payload";

const toolPreferencesStorageKey = "root-access:available-tools";
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

function readStoredAvailableTools() {
  try {
    const storedValue = window.localStorage.getItem(toolPreferencesStorageKey);

    if (!storedValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    const parsedTools = availableToolsSchema.safeParse(parsedValue);

    if (!parsedTools.success) {
      window.localStorage.removeItem(toolPreferencesStorageKey);
      return null;
    }

    return parsedTools.data;
  } catch {
    return null;
  }
}

function writeStoredAvailableTools(
  availableTools: GoalFormValues["availableTools"],
) {
  try {
    window.localStorage.setItem(
      toolPreferencesStorageKey,
      JSON.stringify(availableTools),
    );
  } catch {
    return;
  }
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
  const deadlineUrgencyOptionLabels = {
    "1-3 days": t("fields.deadlineUrgency.options.oneToThreeDays"),
    "1 week": t("fields.deadlineUrgency.options.oneWeek"),
    "2 weeks+": t("fields.deadlineUrgency.options.twoWeeksPlus"),
    "No deadline": t("fields.deadlineUrgency.options.noDeadline"),
  } satisfies Record<(typeof deadlineUrgencyOptions)[number], string>;
  const {
    control,
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
      deadlineUrgency: undefined,
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

    const storedAvailableTools = readStoredAvailableTools();

    if (!storedAvailableTools) {
      return;
    }

    setValue("availableTools", storedAvailableTools, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [setValue]);

  function onSubmit(values: GoalFormValues) {
    const selectedTools = getUniqueAnalyticsTools(values.availableTools);

    writeStoredAvailableTools(values.availableTools);
    writeStoredGoalContext(values);

    track("Workflow Start", {
      mode: values.workflowMode,
      stage: values.currentStage,
      industry: values.industry,
      urgency: values.deadlineUrgency,
      selectedTools: formatAnalyticsTools(selectedTools),
      selectedToolCount: selectedTools.length,
    });

    selectedTools.forEach((tool) => {
      track("Tool Selected", {
        tool,
        stage: values.currentStage,
        urgency: values.deadlineUrgency,
      });
    });

    const params = new URLSearchParams({
      mode: values.workflowMode,
      stage: values.currentStage,
      idea: values.startupIdea,
      industry: values.industry,
      urgency: values.deadlineUrgency,
    });
    if (values.targetCustomer.trim().length > 0) {
      params.set("targetCustomer", values.targetCustomer);
    }
    values.availableTools.forEach((tool) => {
      params.append("availableTools", tool);
    });

    router.push(`/result?${params.toString()}`);
  }

  return (
    <section id="goal-form" className="w-full bg-muted/40 py-16 sm:py-24">
      <div className="mx-auto grid w-full max-w-6xl items-start gap-8 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12 lg:px-10">
        <div className="max-w-xl space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl sm:leading-[1.15]">
            {t("title")}
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <Card className="rounded-lg py-5 shadow-sm">
          <CardHeader className="gap-2">
            <CardTitle className="text-xl">{t("cardTitle")}</CardTitle>
            <CardDescription className="leading-6">
              {t("cardDescription")}
            </CardDescription>
            </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
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

                <FormField
                  id="deadlineUrgency"
                  label={t("fields.deadlineUrgency.label")}
                  description={t("fields.deadlineUrgency.description")}
                  descriptionHeight="paired"
                  error={
                    errors.deadlineUrgency
                      ? t("fields.deadlineUrgency.error")
                      : undefined
                  }
                >
                  <Controller
                    control={control}
                    name="deadlineUrgency"
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          id="deadlineUrgency"
                          className="h-10 w-full"
                          aria-invalid={Boolean(errors.deadlineUrgency)}
                        >
                          <SelectValue
                            placeholder={t(
                              "fields.deadlineUrgency.placeholder",
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {deadlineUrgencyOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {deadlineUrgencyOptionLabels[option]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
              </div>

              <fieldset
                className="grid gap-2.5"
                aria-invalid={Boolean(errors.availableTools)}
                aria-describedby={
                  errors.availableTools
                    ? "availableTools-description availableTools-error"
                    : "availableTools-description"
                }
              >
                <legend className="text-sm font-medium text-foreground">
                  {t("fields.availableTools.label")}
                </legend>
                <p
                  id="availableTools-description"
                  className="text-sm leading-6 text-muted-foreground"
                >
                  {t("fields.availableTools.description")}
                </p>
                <Controller
                  control={control}
                  name="availableTools"
                  render={({ field }) => {
                    const selectedTools = field.value ?? [];

                    return (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {availableToolOptions.map((toolPreference) => {
                          const isSelected =
                            selectedTools.includes(toolPreference);

                          return (
                            <label
                              key={toolPreference}
                              className={cn(
                                "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/50",
                                isSelected &&
                                  "border-foreground bg-muted text-foreground",
                              )}
                            >
                              <input
                                ref={field.ref}
                                type="radio"
                                name={field.name}
                                value={toolPreference}
                                checked={isSelected}
                                onBlur={field.onBlur}
                                onChange={() => {
                                  field.onChange([toolPreference]);
                                }}
                                className="size-4 rounded-full border-input accent-foreground"
                              />
                              <span className="font-medium text-foreground">
                                {toolPreference}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    );
                  }}
                />
                {errors.availableTools ? (
                  <p
                    id="availableTools-error"
                    className="text-sm text-destructive"
                  >
                    {t("fields.availableTools.error")}
                  </p>
                ) : null}
              </fieldset>

              <Button
                type="submit"
                size="lg"
                className="mt-1 h-12 w-full text-base"
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
