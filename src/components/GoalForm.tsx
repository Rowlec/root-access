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
  currentStageOptions,
  deadlineUrgencyOptions,
  goalFormSchema,
  type GoalFormValues,
  workflowModeOptions,
} from "@/lib/goal-form-schema";
import {
  formatAnalyticsTools,
  getUniqueAnalyticsTools,
} from "@/lib/analytics-payload";

const toolPreferencesStorageKey = "root-access:available-tools";
const noPreferenceToolValue = "No preference";
const toolPreferenceOptions = [
  noPreferenceToolValue,
  ...availableToolOptions,
] as const;

type FormFieldProps = {
  children: ReactNode;
  description?: string;
  error?: string;
  id: string;
  label: string;
};

function FormField({
  children,
  description,
  error,
  id,
  label,
}: FormFieldProps) {
  return (
    <div className="grid content-start gap-2.5">
      <label
        htmlFor={id}
        className="min-h-5 text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <p className="min-h-6 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {children}
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

export function GoalForm() {
  const router = useRouter();
  const t = useTranslations("GoalForm");
  const currentStageOptionLabels = {
    "No clear idea yet": t("fields.currentStage.options.noClearIdeaYet"),
    "Have idea but not validated": t(
      "fields.currentStage.options.haveIdeaButNotValidated",
    ),
    "Doing market research": t("fields.currentStage.options.doingMarketResearch"),
    "Building business model": t(
      "fields.currentStage.options.buildingBusinessModel",
    ),
    "Planning MVP": t("fields.currentStage.options.planningMvp"),
    "Preparing pitch deck": t("fields.currentStage.options.preparingPitchDeck"),
  } satisfies Record<(typeof currentStageOptions)[number], string>;
  const deadlineUrgencyOptionLabels = {
    "1-3 days": t("fields.deadlineUrgency.options.oneToThreeDays"),
    "1 week": t("fields.deadlineUrgency.options.oneWeek"),
    "2 weeks+": t("fields.deadlineUrgency.options.twoWeeksPlus"),
    "No deadline": t("fields.deadlineUrgency.options.noDeadline"),
  } satisfies Record<(typeof deadlineUrgencyOptions)[number], string>;
  const workflowModeOptionContent = {
    quick: {
      title: t("fields.workflowMode.options.quick.title"),
      description: t("fields.workflowMode.options.quick.description"),
    },
    deep: {
      title: t("fields.workflowMode.options.deep.title"),
      description: t("fields.workflowMode.options.deep.description"),
    },
  } satisfies Record<
    (typeof workflowModeOptions)[number],
    { title: string; description: string }
  >;
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
      currentStage: undefined,
      startupIdea: "",
      industry: "",
      targetCustomer: "",
      deadlineUrgency: undefined,
      availableTools: [],
    },
  });

  useEffect(() => {
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

  function getAvailableToolLabel(
    toolPreference: (typeof toolPreferenceOptions)[number],
  ) {
    return toolPreference === noPreferenceToolValue
      ? t("fields.availableTools.noPreference")
      : toolPreference;
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
              <fieldset className="grid gap-2.5">
                <legend className="text-sm font-medium text-foreground">
                  {t("fields.workflowMode.label")}
                </legend>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("fields.workflowMode.description")}
                </p>
                <Controller
                  control={control}
                  name="workflowMode"
                  render={({ field }) => (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {workflowModeOptions.map((mode) => {
                        const isSelected = field.value === mode;
                        const modeContent = workflowModeOptionContent[mode];

                        return (
                          <label
                            key={mode}
                            className={cn(
                              "flex min-h-24 cursor-pointer items-start gap-3 rounded-lg border border-input bg-background p-3 text-sm transition-colors hover:bg-muted/50",
                              isSelected &&
                                "border-foreground bg-muted text-foreground",
                            )}
                          >
                            <input
                              ref={field.ref}
                              type="radio"
                              name={field.name}
                              value={mode}
                              checked={isSelected}
                              onBlur={field.onBlur}
                              onChange={() => field.onChange(mode)}
                              className="mt-1 size-4 rounded-full border-input accent-foreground"
                            />
                            <span className="grid gap-1">
                              <span className="font-medium text-foreground">
                                {modeContent.title}
                              </span>
                              <span className="leading-6 text-muted-foreground">
                                {modeContent.description}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
              </fieldset>

              <FormField
                id="currentStage"
                label={t("fields.currentStage.label")}
                error={
                  errors.currentStage
                    ? t("fields.currentStage.error")
                    : undefined
                }
              >
                <Controller
                  control={control}
                  name="currentStage"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        id="currentStage"
                        className="h-10 w-full"
                        aria-invalid={Boolean(errors.currentStage)}
                      >
                        <SelectValue
                          placeholder={t("fields.currentStage.placeholder")}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {currentStageOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {currentStageOptionLabels[option]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

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
                      <div className="grid gap-3 sm:grid-cols-3">
                        {toolPreferenceOptions.map((toolPreference) => {
                          const isNoPreference =
                            toolPreference === noPreferenceToolValue;
                          const isSelected = isNoPreference
                            ? selectedTools.length === 0
                            : selectedTools.includes(toolPreference);

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
                                  field.onChange(
                                    isNoPreference ? [] : [toolPreference],
                                  );
                                }}
                                className="size-4 rounded-full border-input accent-foreground"
                              />
                              <span className="font-medium text-foreground">
                                {getAvailableToolLabel(toolPreference)}
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
