import { getProfileCredits } from "@/lib/server/credit";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const credits = await getProfileCredits(user.id);

    return jsonResponse(
      {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        credits,
      },
      { status: 200 },
      request,
    );
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse(
        { code: "UNAUTHENTICATED", message: "Chưa đăng nhập" },
        { status: 401 },
        request,
      );
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}
