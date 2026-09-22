import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

const isAppRoute = createRouteMatcher([
  "/app(.*)",
  "/admin(.*)",
  "/api/payments/create(.*)",
  "/api/projects(.*)",
]);
const isMeteredAiRoute = createRouteMatcher(["/api/gemini(.*)"]);
const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY &&
    process.env.DATABASE_URL,
);

const clerkHandler = clerkConfigured
  ? clerkMiddleware(async (auth, request) => {
      if (
        process.env.DATABASE_URL &&
        (isAppRoute(request) || isMeteredAiRoute(request))
      ) {
        await auth.protect();
      }
    })
  : null;

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!clerkHandler) {
    return NextResponse.next();
  }

  return clerkHandler(request, event);
}

export const config = {
  matcher: [
    "/app/:path*",
    "/admin/:path*",
    "/api/gemini/:path*",
    "/api/payments/create/:path*",
    "/api/projects/:path*",
  ],
};
