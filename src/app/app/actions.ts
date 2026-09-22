"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createProject } from "@/lib/server/projects";

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
