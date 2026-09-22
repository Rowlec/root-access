import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { projects, usageEvents, workflowStates } from "@/db/schema";
import { ensureCurrentUser, UnauthorizedError } from "@/lib/server/auth";

const bodySchema = z.object({
  builder: z.record(z.string(), z.unknown()).nullable(),
  workspace: z.record(z.string(), z.unknown()).nullable(),
});

async function getProjectForUser(projectId: string) {
  const user = await ensureCurrentUser();
  const [project] = await getDb()
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .limit(1);

  return { project, user };
}

type WorkflowRouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: WorkflowRouteContext) {
  try {
    const { id } = await context.params;
    const { project } = await getProjectForUser(id);

    if (!project) {
      return Response.json({ message: "Project not found." }, { status: 404 });
    }

    const states = await getDb()
      .select()
      .from(workflowStates)
      .where(eq(workflowStates.projectId, id));
    const bySection = Object.fromEntries(states.map((state) => [state.sectionId, state.state]));

    return Response.json({
      builder: bySection.__builder__ ?? null,
      workspace: bySection.__workspace__ ?? null,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ message: error.message }, { status: 401 });
    }
    throw error;
  }
}

export async function PUT(request: Request, context: WorkflowRouteContext) {
  try {
    const { id } = await context.params;
    const { project, user } = await getProjectForUser(id);

    if (!project) {
      return Response.json({ message: "Project not found." }, { status: 404 });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return Response.json({ message: "Invalid workflow state." }, { status: 400 });
    }

    const workspace = parsed.data.workspace;
    const sectionIds = ["problem", "customer", "revenue", "mvp", "differentiation"];
    const completedCount = workspace
      ? sectionIds.filter((sectionId) => {
          const section = workspace[sectionId];
          return Boolean(section && typeof section === "object" && "completed" in section && section.completed);
        }).length
      : 0;
    const currentSection = sectionIds[Math.min(completedCount, sectionIds.length - 1)];
    const db = getDb();

    await db.transaction(async (tx) => {
      for (const [sectionId, state] of [
        ["__workspace__", parsed.data.workspace],
        ["__builder__", parsed.data.builder],
      ] as const) {
        if (!state) continue;
        await tx
          .insert(workflowStates)
          .values({ projectId: id, sectionId, state })
          .onConflictDoUpdate({
            target: [workflowStates.projectId, workflowStates.sectionId],
            set: { state, updatedAt: new Date() },
          });
      }

      await tx
        .update(projects)
        .set({
          currentSection,
          progressPercent: completedCount * 20,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, id));
      await tx.insert(usageEvents).values({
        eventName: "workflow_synced",
        projectId: id,
        properties: { completedSections: completedCount },
        userId: user.id,
      });
    });

    return Response.json({ ok: true, progressPercent: completedCount * 20 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ message: error.message }, { status: 401 });
    }
    throw error;
  }
}
