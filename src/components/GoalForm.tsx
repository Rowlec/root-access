"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { track } from "@vercel/analytics";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import {
  currentStageOptions,
  deadlineUrgencyOptions,
  goalFormSchema,
  type GoalFormValues,
} from "@/lib/goal-form-schema";

export function GoalForm() {
  const router = useRouter();
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      currentStage: undefined,
      startupIdea: "",
      industry: "",
      deadlineUrgency: undefined,
    },
  });

  function onSubmit(values: GoalFormValues) {
    track("Workflow Start", {
      stage: values.currentStage,
      industry: values.industry,
      urgency: values.deadlineUrgency,
    });

    const params = new URLSearchParams({
      stage: values.currentStage,
      idea: values.startupIdea,
      industry: values.industry,
      urgency: values.deadlineUrgency,
    });

    router.push(`/result?${params.toString()}`);
  }

  return (
    <section id="goal-form" className="w-full bg-muted/40 py-16 sm:py-24">
      <div className="mx-auto grid w-full max-w-6xl items-start gap-8 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12 lg:px-10">
        <div className="max-w-xl space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            Start building
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl sm:leading-[1.15]">
            Tell Root Access what you are working on
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            Add your startup context, then follow a guided workflow built for a
            university proposal.
          </p>
        </div>

        <Card className="rounded-lg py-5 shadow-sm">
          <CardHeader className="gap-2">
            <CardTitle className="text-xl">Startup goal</CardTitle>
            <CardDescription className="leading-6">
              Use clear details so the workflow prompts fit your assignment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-2.5">
                <label
                  htmlFor="currentStage"
                  className="text-sm font-medium text-foreground"
                >
                  Current stage
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
                        <SelectValue placeholder="Select your current stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentStageOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.currentStage ? (
                  <p className="text-sm text-destructive">
                    Current stage is required.
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2.5">
                <label
                  htmlFor="startupIdea"
                  className="text-sm font-medium text-foreground"
                >
                  Startup idea
                </label>
                <Textarea
                  id="startupIdea"
                  placeholder="AI study assistant for university students"
                  className="min-h-28 resize-none"
                  aria-invalid={Boolean(errors.startupIdea)}
                  {...register("startupIdea")}
                />
                {errors.startupIdea ? (
                  <p className="text-sm text-destructive">
                    Startup idea must be at least 3 characters.
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2.5">
                  <label
                    htmlFor="industry"
                    className="text-sm font-medium text-foreground"
                  >
                    Industry
                  </label>
                  <Input
                    id="industry"
                    className="h-10"
                    placeholder="Education"
                    aria-invalid={Boolean(errors.industry)}
                    {...register("industry")}
                  />
                  {errors.industry ? (
                    <p className="text-sm text-destructive">
                      Industry is required.
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2.5">
                  <label
                    htmlFor="deadlineUrgency"
                    className="text-sm font-medium text-foreground"
                  >
                    Deadline urgency
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
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          {deadlineUrgencyOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.deadlineUrgency ? (
                    <p className="text-sm text-destructive">
                      Deadline urgency is required.
                    </p>
                  ) : null}
                </div>
              </div>

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
                {isSubmitting ? "Preparing workflow" : "Start Building"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
