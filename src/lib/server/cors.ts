import { NextResponse } from "next/server";

export function getCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function handleCorsPreflight(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export function jsonResponse(
  data: unknown,
  init?: { status?: number; headers?: HeadersInit },
  request?: Request,
) {
  const cors = getCorsHeaders(request);
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: {
      ...cors,
      ...(init?.headers ?? {}),
    },
  });
}
