import {
  ForbiddenError,
  UnauthorizedError,
  ensureCurrentUser,
} from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await ensureCurrentUser();
    const balance = user.profile?.credits ?? user.wallet?.balance ?? 5;
    return Response.json(
      { balance },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ message: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return Response.json({ message: error.message }, { status: 403 });
    }
    throw error;
  }
}
