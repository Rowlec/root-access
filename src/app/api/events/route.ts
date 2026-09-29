import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { events } from "@/db/schema";
import { requireAuthSession } from "@/lib/server/auth";
import { getCorsHeaders, handleCorsPreflight } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    let userId: string | null = null;
    try {
      const session = await requireAuthSession(request.headers);
      userId = session.user.id;
    } catch {
      // Allow unauthenticated tracking if needed
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(request),
      });
    }

    const eventList = Array.isArray(body) ? body : [body];
    const db = getDb();

    for (const item of eventList) {
      if (item && item.name) {
        await db.insert(events).values({
          userId: item.user_id ?? userId,
          name: item.name,
          props: item.props ?? {},
        });
      }
    }

    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(request),
    });
  } catch {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(request),
    });
  }
}
