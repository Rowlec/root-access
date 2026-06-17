"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { track } from "@vercel/analytics";
import { ArrowRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
} from "@/lib/goal-form-schema";
import {
  formatAnalyticsTools,
  getUniqueAnalyticsTools,
} from "@/lib/analytics-payload";

const toolPreferencesStorageKey = "root-access:available-tools";

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
    "Preparing pitch deck": t("fields.currentStage.options.preparingPitchDeck"),
  } satisfies Record<(typeof currentStageOptions)[number], string>;
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
      currentStage: undefined,
      startupIdea: "",
      industry: "",
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
      stage: values.currentStage,
      idea: values.startupIdea,
      industry: values.industry,
      urgency: values.deadlineUrgency,
    });
    values.availableTools.forEach((tool) => {
      params.append("availableTools", tool);
    });

    router.push(`/result?${params.toString()}`);
  }

  function getAvailableToolLabel(tool: (typeof availableToolOptions)[number]) {
    return tool === "Other" ? t("fields.availableTools.other") : tool;
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
              <div className="grid gap-2.5">
                <label
                  htmlFor="currentStage"
                  className="text-sm font-medium text-foreground"
                >
                  {t("fields.currentStage.label")}
                </label>
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
                {errors.currentStage ? (
                  <p className="text-sm text-destructive">
                    {t("fields.currentStage.error")}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2.5">
                <label
                  htmlFor="startupIdea"
                  className="text-sm font-medium text-foreground"
                >
                  {t("fields.startupIdea.label")}
                </label>
                <Textarea
                  id="startupIdea"
                  placeholder={t("fields.startupIdea.placeholder")}
                  className="min-h-28 resize-none"
                  aria-invalid={Boolean(errors.startupIdea)}
                  {...register("startupIdea")}
                />
                {errors.startupIdea ? (
                  <p className="text-sm text-destructive">
                    {t("fields.startupIdea.error")}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2.5">
                  <label
                    htmlFor="industry"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("fields.industry.label")}
                  </label>
                  <Input
                    id="industry"
                    className="h-10"
                    placeholder={t("fields.industry.placeholder")}
                    aria-invalid={Boolean(errors.industry)}
                    {...register("industry")}
                  />
                  {errors.industry ? (
                    <p className="text-sm text-destructive">
                      {t("fields.industry.error")}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2.5">
                  <label
                    htmlFor="deadlineUrgency"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("fields.deadlineUrgency.label")}
                  </label>
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
                  {errors.deadlineUrgency ? (
                    <p className="text-sm text-destructive">
                      {t("fields.deadlineUrgency.error")}
                    </p>
                  ) : null}
                </div>
              </div>

              <fieldset
                className="grid gap-2.5"
                aria-invalid={Boolean(errors.availableTools)}
                aria-describedby={
                  errors.availableTools ? "availableTools-error" : undefined
                }
              >
                <legend className="text-sm font-medium text-foreground">
                  {t("fields.availableTools.label")}
                </legend>
                <Controller
                  control={control}
                  name="availableTools"
                  render={({ field }) => {
                    const selectedTools = field.value ?? [];

                    return (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {availableToolOptions.map((tool) => {
                          const isSelected = selectedTools.includes(tool);

                          return (
                            <label
                              key={tool}
                              className={cn(
                                "flex h-11 cursor-pointer items-center gap-3 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:bg-muted/50",
                                isSelected &&
                                  "border-foreground bg-muted text-foreground",
                              )}
                            >
                              <input
                                ref={field.ref}
                                type="checkbox"
                                name={field.name}
                                value={tool}
                                checked={isSelected}
                                onBlur={field.onBlur}
                                onChange={(event) => {
                                  const nextTools = event.target.checked
                                    ? [...selectedTools, tool]
                                    : selectedTools.filter(
                                        (selectedTool) => selectedTool !== tool,
                                      );

                                  field.onChange(nextTools);
                                }}
                                className="size-4 rounded border-input accent-foreground"
                                aria-invalid={Boolean(errors.availableTools)}
                              />
                              <span className="font-medium text-foreground">
                                {getAvailableToolLabel(tool)}
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
