"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { createProject } from "@/lib/server/projects";
import { getDb } from "@/db";
import { projects, usageEvents } from "@/db/schema";
import { ensureCurrentUser } from "@/lib/server/auth";

const createProjectSchema = z.object({
  industry: z.string().trim().min(2).max(120),
  startupIdea: z.string().trim().min(10).max(2000),
  targetCustomer: z.string().trim().max(500),
  title: z.string().trim().min(3).max(120),
});

export type CreateProjectState = {
  error?: string;
};

export async function createProjectAction(
  _state: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  const parsed = createProjectSchema.safeParse({
    industry: formData.get("industry"),
    startupIdea: formData.get("startupIdea"),
    targetCustomer: formData.get("targetCustomer"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return { error: "Vui lòng nhập đủ tên, ý tưởng và lĩnh vực của dự án." };
  }

  const project = await createProject(parsed.data);
  redirect(`/app/projects/${project.id}`);
}

const projectUpdateSchema = z.object({
  id: z.string().uuid(),
  industry: z.string().trim().min(2).max(120),
  startupIdea: z.string().trim().min(10).max(2000),
  targetCustomer: z.string().trim().max(500),
  title: z.string().trim().min(3).max(120),
});

export async function updateProjectAction(formData: FormData) {
  const parsed = projectUpdateSchema.safeParse({
    id: formData.get("id"),
    industry: formData.get("industry"),
    startupIdea: formData.get("startupIdea"),
    targetCustomer: formData.get("targetCustomer"),
    title: formData.get("title"),
  });

  if (!parsed.success) return;
  const user = await ensureCurrentUser();
  const { id, ...updates } = parsed.data;
  await getDb()
    .update(projects)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, user.id)));
  revalidatePath("/app");
  revalidatePath(`/app/projects/${id}`);
}

export async function setProjectStatusAction(formData: FormData) {
  const parsed = z
    .object({ id: z.string().uuid(), status: z.enum(["active", "archived"]) })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });

  if (!parsed.success) return;
  const user = await ensureCurrentUser();
  await getDb()
    .update(projects)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(and(eq(projects.id, parsed.data.id), eq(projects.userId, user.id)));
  revalidatePath("/app");
  revalidatePath("/app/projects");
  redirect("/app/projects");
}

export async function deleteProjectAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  const confirmation = z.string().safeParse(formData.get("confirmation"));
  if (!id.success || !confirmation.success) return;

  const user = await ensureCurrentUser();
  const [project] = await getDb()
    .select({ id: projects.id, title: projects.title })
    .from(projects)
    .where(and(eq(projects.id, id.data), eq(projects.userId, user.id)))
    .limit(1);
  if (!project || confirmation.data !== project.title) return;

  await getDb().transaction(async (tx) => {
    await tx.insert(usageEvents).values({
      eventName: "project_deleted",
      properties: { title: project.title },
      userId: user.id,
    });
    await tx.delete(projects).where(eq(projects.id, project.id));
  });
  revalidatePath("/app");
  redirect("/app/projects");
}
