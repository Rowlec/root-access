import { FileText, ListChecks, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function HowItWorks() {
  const t = useTranslations("HowItWorks");
  const steps = [
    {
      title: t("steps.idea.title"),
      description: t("steps.idea.description"),
      icon: FileText,
    },
    {
      title: t("steps.workflow.title"),
      description: t("steps.workflow.description"),
      icon: ListChecks,
    },
    {
      title: t("steps.proposal.title"),
      description: t("steps.proposal.description"),
      icon: Rocket,
    },
  ];

  return (
    <section className="w-full bg-background py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mb-10 max-w-2xl space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {t("eyebrow")}
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl sm:leading-[1.15]">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:gap-5">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <Card
                key={step.title}
                className="rounded-lg py-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader className="gap-5">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t("stepLabel", { step: index + 1 })}
                    </p>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription className="leading-6">
                      {step.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
