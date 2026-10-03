import { desc, eq, inArray, or } from "drizzle-orm";
import { getDb } from "@/db";
import { projectMembers, projects } from "@/db/schema";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const db = getDb();

    // Spec v2.2 Trang 28: Projects include owned and member projects
    const memberships = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, user.id));

    const memberProjectIds = memberships.map((m) => m.projectId);

    const conditions = memberProjectIds.length > 0
      ? or(eq(projects.userId, user.id), inArray(projects.id, memberProjectIds))
      : eq(projects.userId, user.id);

    const userProjects = await db
      .select()
      .from(projects)
      .where(conditions)
      .orderBy(desc(projects.updatedAt));

    return jsonResponse(userProjects, { status: 200 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}

export async function POST(request: Request) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const body = await request.json();

    const name = (body.name ?? body.title ?? "").trim();
    const oneLiner = (body.one_liner ?? body.oneLiner ?? body.idea ?? body.startup_idea ?? "").trim();
    const niche = (body.niche ?? body.target_customer ?? body.targetCustomer ?? "").trim();
    const domain = (body.domain ?? body.industry ?? "").trim();
    const observedProblem = (body.observed_problem ?? body.observedProblem ?? "").trim();
    const biggestAssumption = (body.biggest_assumption ?? body.biggestAssumption ?? "").trim();
    const teamStrengths = Array.isArray(body.team_strengths) ? body.team_strengths : Array.isArray(body.teamStrengths) ? body.teamStrengths : [];
    const constraints = Array.isArray(body.constraints) ? body.constraints : [];
    const createdVia = body.created_via ?? body.createdVia ?? "studio";
    const availableData = body.available_data ?? body.availableData ?? {};
    const packId = body.pack_id ?? body.packId ?? "exe101-cp2";

    if (!name || (!oneLiner && !observedProblem)) {
      return jsonResponse(
        { code: "INVALID_INPUT", message: "Tên dự án và ý tưởng không được để trống." },
        { status: 422 },
        request,
      );
    }

    const db = getDb();
    const [newProject] = await db
      .insert(projects)
      .values({
        userId: user.id,
        name,
        idea: oneLiner,
        targetCustomer: niche,
        oneLiner,
        niche,
        domain,
        observedProblem,
        biggestAssumption,
        teamStrengths,
        constraints,
        createdVia,
        availableData,
        packId,
        title: name,
        startupIdea: oneLiner,
        industry: domain || "Khởi nghiệp",
      })
      .returning();

    // Add creator as owner in project_members
    try {
      await db.insert(projectMembers).values({
        projectId: newProject.id,
        userId: user.id,
        role: "owner",
      });
    } catch (e) {
      console.warn("Could not insert creator into project_members:", e);
    }

    return jsonResponse(newProject, { status: 201 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}
