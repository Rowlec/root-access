import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { packs, projects, sectionIntakes, tasks } from "@/db/schema";
import { Pack } from "@/lib/packs-schema";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string; sid: string }> },
) {
  try {
    await ensureCurrentUser(request.headers);
    const { id: projectId, sid: sectionId } = await props.params;

    const db = getDb();
    const [row] = await db
      .select()
      .from(sectionIntakes)
      .where(and(eq(sectionIntakes.projectId, projectId), eq(sectionIntakes.sectionId, sectionId)))
      .limit(1);

    return jsonResponse({ answers: row?.answers ?? {} }, { status: 200 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string; sid: string }> },
) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const { id: projectId, sid: sectionId } = await props.params;
    const body = await request.json();
    const answers = body.answers || body || {};

    const db = getDb();

    // Upsert sectionIntakes
    const [existing] = await db
      .select()
      .from(sectionIntakes)
      .where(and(eq(sectionIntakes.projectId, projectId), eq(sectionIntakes.sectionId, sectionId)))
      .limit(1);

    let savedIntake;
    if (existing) {
      [savedIntake] = await db
        .update(sectionIntakes)
        .set({
          answers,
          updatedAt: new Date(),
        })
        .where(and(eq(sectionIntakes.projectId, projectId), eq(sectionIntakes.sectionId, sectionId)))
        .returning();
    } else {
      [savedIntake] = await db
        .insert(sectionIntakes)
        .values({
          projectId,
          sectionId,
          answers,
        })
        .returning();
    }

    // Spec v2.2 Mục 4.1: If user selects unknown ("Chưa biết" / "Chưa hỏi ai"), add task to tasks table
    try {
      const [proj] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
      if (proj) {
        const [packRow] = await db.select().from(packs).where(eq(packs.id, proj.packId)).limit(1);
        if (packRow) {
          const pack = packRow.content as unknown as Pack;
          const section = pack.sections?.find((s) => s.id === sectionId);
          if (section?.intake) {
            for (const q of section.intake) {
              const val = answers[q.id];
              const isUnknown =
                val === undefined ||
                val === null ||
                val === "" ||
                val === q.unknown_label ||
                (Array.isArray(val) && val.length === 0);

              if (isUnknown && q.if_unknown_task) {
                // Check if task already exists
                const [existingTask] = await db
                  .select()
                  .from(tasks)
                  .where(
                    and(
                      eq(tasks.projectId, projectId),
                      eq(tasks.title, q.if_unknown_task),
                    ),
                  )
                  .limit(1);

                if (!existingTask) {
                  await db.insert(tasks).values({
                    projectId,
                    sectionId,
                    title: q.if_unknown_task,
                    source: "intake",
                    done: false,
                  });
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("Could not check/create tasks from intake:", e);
    }

    return jsonResponse({ answers: savedIntake.answers }, { status: 200 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}
