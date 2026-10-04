import { notFound } from "next/navigation";
import { WebWriteWorkspace } from "@/components/project/WebWriteWorkspace";
import { getOwnedProject } from "@/lib/server/projects";
import { getDb } from "@/db";
import { grades, packs, projectSections, sectionIntakes } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Pack } from "@/lib/packs-schema";

export default async function WriteSectionPage({
  params,
}: {
  params: Promise<{ id: string; sectionId: string }>;
}) {
  const { id, sectionId } = await params;
  const { project } = await getOwnedProject(id);

  const db = getDb();
  const effectivePackId = project.packId || "exe101-cp2";

  const [packRow, intakeRow, savedSectionRow, latestGradeRow] = await Promise.all([
    db
      .select()
      .from(packs)
      .where(and(eq(packs.id, effectivePackId), eq(packs.isActive, true)))
      .orderBy(desc(packs.version))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(sectionIntakes)
      .where(and(eq(sectionIntakes.projectId, project.id), eq(sectionIntakes.sectionId, sectionId)))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(projectSections)
      .where(and(eq(projectSections.projectId, project.id), eq(projectSections.sectionId, sectionId)))
      .limit(1)
      .then((r) => r[0]),
    db
      .select()
      .from(grades)
      .where(and(eq(grades.projectId, project.id), eq(grades.sectionId, sectionId)))
      .orderBy(desc(grades.createdAt))
      .limit(1)
      .then((r) => r[0]),
  ]);

  let resolvedPackRow = packRow;
  if (!resolvedPackRow) {
    const [fallbackPack] = await db
      .select()
      .from(packs)
      .where(eq(packs.id, effectivePackId))
      .orderBy(desc(packs.version))
      .limit(1);
    resolvedPackRow = fallbackPack;
  }
  if (!resolvedPackRow) {
    const [anyActivePack] = await db
      .select()
      .from(packs)
      .where(eq(packs.isActive, true))
      .orderBy(desc(packs.version))
      .limit(1);
    resolvedPackRow = anyActivePack;
  }

  const packContent = (resolvedPackRow?.content ?? {}) as unknown as Pack;
  const sections = packContent.sections || [];

  const currentSection = sections.find((s) => s.id === sectionId);
  if (!currentSection) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-svh w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10 lg:py-10">
      <WebWriteWorkspace
        key={sectionId}
        projectId={project.id}
        sectionId={sectionId}
        projectName={project.name || project.title}
        oneLiner={project.oneLiner || project.idea || project.startupIdea || ""}
        niche={project.niche || project.targetCustomer || ""}
        packId={effectivePackId}
        sections={sections.map((s) => ({
          id: s.id,
          title: s.title,
          order: s.order,
        }))}
        initialIntakeQuestions={currentSection.intake || []}
        initialIntakeAnswers={intakeRow?.answers || {}}
        initialSavedText={savedSectionRow?.savedText || ""}
        initialGradeResult={latestGradeRow?.result || null}
        initialTargetLevel={project.targetLevel || null}
      />
    </main>
  );
}
