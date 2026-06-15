"use client";

import { track } from "@vercel/analytics";
import { ExternalLink } from "lucide-react";

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

export function FeedbackCard() {
  return (
    <Card className="rounded-lg py-5 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="gap-2">
        <CardTitle className="text-xl">Help us improve Root Access</CardTitle>
        <CardDescription className="leading-6">
          Your feedback helps us learn whether this workflow actually reduces
          confusion, prompt retries, and time spent on startup assignments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          Share what worked, where you got stuck, and what would make the next
          version more useful for students.
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
              })
            }
          >
            Submit Feedback
            <ExternalLink aria-hidden="true" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
