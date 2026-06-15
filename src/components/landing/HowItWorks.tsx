import { FileText, ListChecks, Rocket } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const steps = [
  {
    title: "Enter startup idea",
    description: "Share your idea and industry so Root Access can shape the workflow around your assignment.",
    icon: FileText,
  },
  {
    title: "Get guided workflow",
    description: "Move through clear steps with practical prompts for problem, customer, MVP, and pitch work.",
    icon: ListChecks,
  },
  {
    title: "Build proposal faster",
    description: "Turn structured outputs into a cleaner startup proposal without repeated prompt guessing.",
    icon: Rocket,
  },
];

export function HowItWorks() {
  return (
    <section className="w-full bg-background py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mb-10 max-w-2xl space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            How it works
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl sm:leading-[1.15]">
            From idea to proposal in three focused moves
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
                      Step {index + 1}
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
