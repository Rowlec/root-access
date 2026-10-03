import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";
import { fetchProjectHubData } from "@/lib/server/projects";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await props.params;
    const overviewData = await fetchProjectHubData(projectId);
    return jsonResponse(overviewData, { status: 200 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError" || err.message?.includes("Chưa đăng nhập")) {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    if (err.name === "ForbiddenError" || err.message?.includes("Project not found") || err.message?.includes("Access denied")) {
      return jsonResponse({ error: err.message }, { status: 403 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}
