"use client";

import { track } from "@vercel/analytics";
import { useEffect } from "react";

export function LandingAnalytics() {
  useEffect(() => {
    track("Landing Visit");
  }, []);

  return null;
}
