import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";

const isProtectedPage = createRouteMatcher(["/app(.*)", "/admin(.*)"]);
const isProtectedApi = createRouteMatcher([
  "/api/payments/create(.*)",
  "/api/projects(.*)",
  "/api/gemini(.*)",
  "/api/credits(.*)",
]);
const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY &&
    process.env.DATABASE_URL,
);

const clerkHandler = clerkConfigured
  ? clerkMiddleware(async (auth, request) => {
      const { userId } = await auth();

      if (isProtectedApi(request) && !userId) {
        return NextResponse.json(
          { code: "unauthorized", message: "Authentication required." },
          { status: 401 },
        );
      }

      if (isProtectedPage(request) && !userId) {
        const signInUrl = new URL("/sign-in", request.url);
        signInUrl.searchParams.set(
          "redirect_url",
          `${request.nextUrl.pathname}${request.nextUrl.search}`,
        );
        return NextResponse.redirect(signInUrl);
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
    "/api/credits/:path*",
    "/api/payments/create/:path*",
    "/api/projects/:path*",
  ],
};
