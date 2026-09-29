import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

function isProtectedPage(pathname: string) {
  return pathname.startsWith("/app") || pathname.startsWith("/admin");
}

function isProtectedApi(pathname: string) {
  return (
    pathname.startsWith("/api/credits") ||
    pathname.startsWith("/api/gemini") ||
    pathname.startsWith("/api/payments/create") ||
    pathname.startsWith("/api/projects")
  );
}

export function proxy(request: NextRequest) {
  // Always allow CORS preflight requests to pass through
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const hasSessionCookie = Boolean(getSessionCookie(request));
  const authHeader = request.headers.get("authorization");
  const hasBearerToken = Boolean(authHeader && authHeader.startsWith("Bearer "));

  if (isProtectedApi(pathname) && !hasSessionCookie && !hasBearerToken) {
    return NextResponse.json(
      { code: "unauthorized", message: "Authentication required." },
      { status: 401 },
    );
  }

  if (isProtectedPage(pathname) && !hasSessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
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
