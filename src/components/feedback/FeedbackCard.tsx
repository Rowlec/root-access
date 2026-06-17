"use client";

import { track } from "@vercel/analytics";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GOOGLE_FORM_URL } from "@/constants/links";
import {
  formatAnalyticsTools,
  getUniqueAnalyticsTools,
} from "@/lib/analytics-payload";

type FeedbackCardProps = {
  adaptedToolCount?: number;
  availableTools?: string[];
  workflowId?: string;
  workflowRunId?: string;
  workflowTitle?: string;
};

export function FeedbackCard({
  adaptedToolCount = 0,
  availableTools = [],
  workflowId = "",
  workflowRunId = "",
  workflowTitle = "",
}: FeedbackCardProps) {
  const t = useTranslations("FeedbackCard");
  const selectedTools = getUniqueAnalyticsTools(availableTools);

  return (
    <Card className="rounded-lg py-5 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="gap-2">
        <CardTitle className="text-xl">{t("title")}</CardTitle>
        <CardDescription className="leading-6">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          {t("body")}
        </p>
      </CardContent>
      <CardFooter className="justify-start">
        <Button asChild className="h-10 w-full sm:w-auto">
          <a
            href={GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track("Feedback Click", {
                source: "feedback_card",
                workflowId,
                workflowRunId,
                workflowTitle,
                selectedTools: formatAnalyticsTools(selectedTools),
                selectedToolCount: selectedTools.length,
                adaptedToolCount,
              })
            }
          >
            {t("action")}
            <ExternalLink aria-hidden="true" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
