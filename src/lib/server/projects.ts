import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { getDb } from "@/db";
import {
  conversations,
  projects,
  usageEvents,
  wallets,
} from "@/db/schema";
import { ensureCurrentUser, ForbiddenError } from "@/lib/server/auth";

export async function getWorkspaceOverview() {
  const user = await ensureCurrentUser();
  const db = getDb();
  const [projectList, wallet] = await Promise.all([
    db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, user.id), eq(projects.status, "active")))
      .orderBy(desc(projects.updatedAt))
      .limit(30),
    db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1),
  ]);

  return { projects: projectList, user, wallet: wallet[0] };
}

export async function createProject(input: {
  industry: string;
  startupIdea: string;
  targetCustomer: string;
  title: string;
}) {
  const user = await ensureCurrentUser();
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .insert(projects)
      .values({ ...input, userId: user.id })
      .returning();

    await tx.insert(conversations).values({ projectId: project.id });
    await tx.insert(usageEvents).values({
      eventName: "project_created",
      projectId: project.id,
      properties: { industry: input.industry },
      userId: user.id,
    });

    return project;
  });
}

export async function getOwnedProject(projectId: string) {
  const user = await ensureCurrentUser();
  const [project] = await getDb()
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) {
    throw new ForbiddenError("Project not found or access denied.");
  }

  return { project, user };
}
