import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db";
import {
  conversations,
  creditLedger,
  projectMembers,
  projects,
  usageEvents,
  wallets,
  workflowStates,
} from "@/db/schema";
import { ensureCurrentUser, ForbiddenError } from "@/lib/server/auth";

export async function getWorkspaceOverview() {
  const user = await ensureCurrentUser();
  const db = getDb();

  const memberships = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, user.id));

  const memberProjectIds = memberships.map((m) => m.projectId);

  const [ownedProjects, memberProjects, wallet] = await Promise.all([
    db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, user.id), eq(projects.status, "active")))
      .orderBy(desc(projects.updatedAt))
      .limit(30),
    memberProjectIds.length > 0
      ? db
          .select()
          .from(projects)
          .where(and(inArray(projects.id, memberProjectIds), eq(projects.status, "active")))
          .orderBy(desc(projects.updatedAt))
          .limit(30)
      : Promise.resolve([]),
    db.select().from(wallets).where(eq(wallets.userId, user.id)).limit(1),
  ]);

  const allProjects = [...ownedProjects];
  for (const p of memberProjects) {
    if (!allProjects.some((x) => x.id === p.id)) {
      allProjects.push(p);
    }
  }

  return { projects: allProjects, user, wallet: wallet[0] };
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
  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    throw new ForbiddenError("Project not found.");
  }

  if (project.userId !== user.id) {
    const [member] = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)))
      .limit(1);

    if (!member) {
      throw new ForbiddenError("Access denied to this project.");
    }
  }

  return { project, user };
}

export async function fetchProjectHubData(projectId: string) {
  const { project, user } = await getOwnedProject(projectId);
  const db = getDb();

  const { packs, projectSections, grades, tasks, teamPasses, users: usersTable } = await import("@/db/schema");
  const { gt } = await import("drizzle-orm");

  const [packRow] = await db
    .select()
    .from(packs)
    .where(eq(packs.id, project.packId))
    .limit(1);

  const packContent = (packRow?.content ?? {}) as any;

  const savedSectionRows = await db
    .select()
    .from(projectSections)
    .where(eq(projectSections.projectId, projectId));

  const savedMap = new Map(savedSectionRows.map((s) => [s.sectionId, s]));

  const allGrades = await db
    .select()
    .from(grades)
    .where(eq(grades.projectId, projectId))
    .orderBy(desc(grades.createdAt));

  const gradesBySection = new Map<string, { latest: any; count: number }>();
  for (const g of allGrades) {
    const existing = gradesBySection.get(g.sectionId);
    if (!existing) {
      gradesBySection.set(g.sectionId, {
        latest: g.result as any,
        count: 1,
      });
    } else {
      existing.count += 1;
    }
  }

  const sectionsOverview = (packContent.sections || []).map((sec: any) => {
    const saved = savedMap.get(sec.id);
    const gradeInfo = gradesBySection.get(sec.id);

    let status = "todo";
    if (saved?.status === "passed" || Boolean(saved?.savedText)) {
      status = "passed";
    } else if (gradeInfo && gradeInfo.count > 0) {
      status = "drafting";
    }

    return {
      id: sec.id,
      title: sec.title,
      order: sec.order,
      requirement: sec.requirement,
      status,
      saved_text: saved?.savedText ?? null,
      chat_url: saved?.chatUrl ?? null,
      grades_count: gradeInfo?.count ?? 0,
      latest_grade: gradeInfo?.latest ?? null,
      criteria: (sec.criteria || []).map((c: any) => {
        const graded = gradeInfo?.latest?.criteria?.find((gc: any) => gc.id === c.id);
        return {
          id: c.id,
          name: c.name,
          level: graded?.level ?? null,
          reason: graded?.reason ?? null,
        };
      }),
    };
  });

  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(tasks.done, desc(tasks.createdAt));

  const memberRows = await db
    .select({
      userId: projectMembers.userId,
      role: projectMembers.role,
      joinedAt: projectMembers.joinedAt,
      displayName: usersTable.displayName,
      email: usersTable.email,
    })
    .from(projectMembers)
    .leftJoin(usersTable, eq(projectMembers.userId, usersTable.id))
    .where(eq(projectMembers.projectId, projectId));

  const [teamPass] = await db
    .select()
    .from(teamPasses)
    .where(and(eq(teamPasses.projectId, projectId), gt(teamPasses.endsAt, new Date())))
    .limit(1);

  const nextSection = sectionsOverview.find((s: any) => s.status !== "passed") || sectionsOverview[0];
  const passedCount = sectionsOverview.filter((s: any) => s.status === "passed" || Boolean(s.saved_text)).length;
  const canFullCheck = passedCount >= 2;

  let daysLeft = 21;
  if (packRow?.endsAt) {
    const msDiff = new Date(packRow.endsAt).getTime() - Date.now();
    daysLeft = Math.max(1, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
  }

  return {
    project: {
      id: project.id,
      name: project.name || project.title,
      one_liner: project.oneLiner || project.idea || project.startupIdea,
      niche: project.niche || project.targetCustomer,
      domain: project.domain || project.industry,
      observed_problem: project.observedProblem,
      biggest_assumption: project.biggestAssumption,
      team_strengths: project.teamStrengths,
      constraints: project.constraints,
      pack_id: project.packId,
      created_via: project.createdVia,
      is_owner: project.userId === user.id,
    },
    pack: {
      id: packRow?.id ?? "exe101-cp2",
      checkpoint: packRow?.checkpoint ?? "Checkpoint 2",
      course: packRow?.course ?? "EXE101",
      term: packRow?.term ?? "SP26",
      days_left: daysLeft,
    },
    sections: sectionsOverview,
    tasks: taskRows.map((t) => ({
      id: t.id,
      sectionId: t.sectionId,
      title: t.title,
      source: t.source,
      done: t.done,
      createdAt: t.createdAt.toISOString(),
    })),
    members: memberRows.map((m) => ({
      userId: m.userId,
      role: m.role as "owner" | "member",
      joinedAt: m.joinedAt.toISOString(),
      displayName: m.displayName,
      email: m.email,
    })),
    team_pass: teamPass
      ? {
          id: teamPass.id,
          grade_cap: teamPass.gradeCap,
          grades_used: teamPass.gradesUsed,
          full_check_cap: teamPass.fullCheckCap,
          full_checks_used: teamPass.fullChecksUsed,
          ends_at: teamPass.endsAt.toISOString(),
        }
      : null,
    next_section_id: nextSection?.id ?? "problem",
    can_full_check: canFullCheck,
    saved_count: passedCount,
    total_sections: sectionsOverview.length,
  };
}

export async function getAllOwnedProjects() {
  const user = await ensureCurrentUser();
  const projectList = await getDb()
    .select()
    .from(projects)
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.updatedAt));

  return { projects: projectList, user };
}

export async function getCreditHistory() {
  const user = await ensureCurrentUser();
  const db = getDb();
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.userId, user.id))
    .limit(1);
  const entries = wallet
    ? await db
        .select()
        .from(creditLedger)
        .where(eq(creditLedger.walletId, wallet.id))
        .orderBy(desc(creditLedger.createdAt))
        .limit(100)
    : [];

  return { entries, user, wallet };
}

export async function getProjectWorkflowState(projectId: string) {
  const { project, user } = await getOwnedProject(projectId);
  const states = await getDb()
    .select()
    .from(workflowStates)
    .where(eq(workflowStates.projectId, projectId));
  const bySection = Object.fromEntries(
    states.map((state) => [state.sectionId, state.state]),
  );

  return {
    builder: bySection.__builder__ ?? null,
    project,
    user,
    workspace: bySection.__workspace__ ?? null,
  };
}
