import { notFound } from "next/navigation";
import { WebWriteWorkspace } from "@/components/project/WebWriteWorkspace";
import { getOwnedProject } from "@/lib/server/projects";
import { getDb } from "@/db";
import { packs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Pack } from "@/lib/packs-schema";

export default async function WriteSectionPage({
  params,
}: {
  params: Promise<{ id: string; sectionId: string }>;
}) {
  const { id, sectionId } = await params;
  const { project } = await getOwnedProject(id);

  const db = getDb();
  const [packRow] = await db
    .select()
    .from(packs)
    .where(eq(packs.id, project.packId))
    .limit(1);

  const packContent = (packRow?.content ?? {}) as unknown as Pack;
  const sections = packContent.sections || [];

  const currentSection = sections.find((s) => s.id === sectionId);
  if (!currentSection) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-svh w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10 lg:py-10">
      <WebWriteWorkspace
        projectId={project.id}
        sectionId={sectionId}
        projectName={project.name || project.title}
        oneLiner={project.oneLiner || project.idea || project.startupIdea || ""}
        niche={project.niche || project.targetCustomer || ""}
        packId={project.packId}
        sections={sections.map((s) => ({
          id: s.id,
          title: s.title,
          order: s.order,
        }))}
      />
    </main>
  );
}
