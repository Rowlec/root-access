import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const projectStatus = pgEnum("project_status", ["active", "archived"]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "cancelled",
  "expired",
  "failed",
]);
export const messageRole = pgEnum("message_role", ["user", "assistant", "system"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authUserId: text("auth_user_id"),
    legacyClerkUserId: text("clerk_user_id"),
    email: text("email"),
    displayName: text("display_name"),
    role: userRole("role").default("user").notNull(),
    isDisabled: boolean("is_disabled").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_auth_user_id_uidx").on(table.authUserId),
    uniqueIndex("users_clerk_user_id_uidx").on(table.legacyClerkUserId),
  ],
);

export const authUser = pgTable(
  "auth_user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("auth_user_email_uidx").on(table.email)],
);

export const authSession = pgTable(
  "auth_session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .references(() => authUser.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    uniqueIndex("auth_session_token_uidx").on(table.token),
    index("auth_session_user_id_idx").on(table.userId),
  ],
);

export const authAccount = pgTable(
  "auth_account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .references(() => authUser.id, { onDelete: "cascade" })
      .notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("auth_account_user_id_idx").on(table.userId),
    uniqueIndex("auth_account_provider_account_uidx").on(
      table.providerId,
      table.accountId,
    ),
  ],
);

export const authVerification = pgTable(
  "auth_verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [index("auth_verification_identifier_idx").on(table.identifier)],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").default("").notNull(),
    idea: text("idea").default("").notNull(),
    targetCustomer: text("target_customer").default("").notNull(),
    availableData: jsonb("available_data").$type<{
      surveyCount?: number;
      interviewCount?: number;
      keyFindings?: string;
      freeText?: string;
      [key: string]: unknown;
    }>().default({}).notNull(),
    packId: text("pack_id").default("exe101-cp2").notNull(),
    oneLiner: text("one_liner").default("").notNull(),
    domain: text("domain").default("").notNull(),
    niche: text("niche").default("").notNull(),
    observedProblem: text("observed_problem").default("").notNull(),
    biggestAssumption: text("biggest_assumption").default("").notNull(),
    teamStrengths: jsonb("team_strengths").$type<string[]>().default([]).notNull(),
    constraints: jsonb("constraints").$type<string[]>().default([]).notNull(),
    createdVia: text("created_via").default("studio").notNull(),
    targetLevel: text("target_level").$type<"pass" | "good" | "excellent">(),
    // Backward compatibility fields
    title: text("title").default("").notNull(),
    startupIdea: text("startup_idea").default("").notNull(),
    industry: text("industry").default("Khởi nghiệp").notNull(),
    status: projectStatus("status").default("active").notNull(),
    currentSection: text("current_section").default("problem").notNull(),
    progressPercent: integer("progress_percent").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    index("projects_user_id_idx").on(table.userId),
    index("projects_updated_at_idx").on(table.updatedAt),
    index("projects_pack_id_idx").on(table.packId),
  ],
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").default("Guided proposal").notNull(),
    ...timestamps,
  },
  (table) => [index("conversations_project_id_idx").on(table.projectId)],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .references(() => conversations.id, { onDelete: "cascade" })
      .notNull(),
    role: messageRole("role").notNull(),
    content: text("content").notNull(),
    model: text("model"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("messages_conversation_id_idx").on(table.conversationId)],
);

export const workflowStates = pgTable(
  "workflow_states",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    sectionId: text("section_id").notNull(),
    state: jsonb("state").$type<Record<string, unknown>>().default({}).notNull(),
    completed: boolean("completed").default(false).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("workflow_states_project_section_uidx").on(
      table.projectId,
      table.sectionId,
    ),
  ],
);

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    balance: integer("balance").default(5).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("wallets_user_id_uidx").on(table.userId)],
);

export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    walletId: uuid("wallet_id")
      .references(() => wallets.id, { onDelete: "cascade" })
      .notNull(),
    amount: integer("amount").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    reason: text("reason").notNull(),
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    idempotencyKey: text("idempotency_key").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("credit_ledger_idempotency_uidx").on(table.idempotencyKey),
    index("credit_ledger_wallet_id_idx").on(table.walletId),
  ],
);

export const tokenPackages = pgTable("token_packages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  credits: integer("credits").notNull(),
  priceVnd: integer("price_vnd").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  ...timestamps,
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    packageId: text("package_id").notNull(),
    orderCode: bigint("order_code", { mode: "number" }).notNull(),
    amountVnd: integer("amount_vnd").notNull(),
    credits: integer("credits").notNull(),
    provider: text("provider").default("payos").notNull(),
    providerPaymentLinkId: text("provider_payment_link_id"),
    checkoutUrl: text("checkout_url"),
    status: orderStatus("status").default("pending").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("orders_order_code_uidx").on(table.orderCode),
    index("orders_user_id_idx").on(table.userId),
  ],
);

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider").default("payos").notNull(),
    providerEventId: text("provider_event_id").notNull(),
    orderCode: bigint("order_code", { mode: "number" }),
    signatureVerified: boolean("signature_verified").default(false).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("payment_events_provider_event_uidx").on(
      table.provider,
      table.providerEventId,
    ),
  ],
);

export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    eventName: text("event_name").notNull(),
    properties: jsonb("properties").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("usage_events_name_idx").on(table.eventName),
    index("usage_events_created_at_idx").on(table.createdAt),
  ],
);

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminUserId: uuid("admin_user_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("admin_audit_logs_admin_idx").on(table.adminUserId)],
);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name"),
    credits: integer("credits").default(5).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

export const packs = pgTable(
  "packs",
  {
    id: text("id").notNull(),
    version: integer("version").notNull(),
    course: text("course").notNull(),
    term: text("term").notNull(),
    checkpoint: text("checkpoint").notNull(),
    source: text("source").notNull(),
    content: jsonb("content").$type<Record<string, unknown>>().notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.version] }),
    index("packs_is_active_idx").on(table.isActive),
  ],
);

export const promptInsertions = pgTable(
  "prompt_insertions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
    sectionId: text("section_id").notNull(),
    kind: text("kind").notNull(), // 'initial' | 'fix'
    promptText: text("prompt_text").notNull(),
    site: text("site").notNull(), // 'chatgpt' | 'gemini' | 'unknown'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("prompt_insertions_project_id_idx").on(table.projectId),
    index("prompt_insertions_user_id_idx").on(table.userId),
  ],
);

export const grades = pgTable(
  "grades",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
    packId: text("pack_id").notNull(),
    packVersion: integer("pack_version").notNull(),
    sectionId: text("section_id").notNull(),
    site: text("site").notNull(),
    outputText: text("output_text").notNull(),
    outputHash: text("output_hash").notNull(),
    result: jsonb("result").$type<Record<string, unknown>>().notNull(),
    parentGradeId: uuid("parent_grade_id"),
    promptVersion: text("prompt_version").default("v2").notNull(),
    model: text("model").default("gemini-2.5-flash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("grades_project_id_idx").on(table.projectId),
    index("grades_user_id_idx").on(table.userId),
    index("grades_parent_grade_id_idx").on(table.parentGradeId),
  ],
);

export const fixActionsUsed = pgTable(
  "fix_actions_used",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gradeId: uuid("grade_id").references(() => grades.id, { onDelete: "cascade" }).notNull(),
    actionId: text("action_id").notNull(),
    type: text("type").notNull(), // 'NEED_DATA' | 'TASK' | 'MARK_ASSUMPTIONS' | 'FOCUS_REWRITE'
    userInput: jsonb("user_input").$type<Record<string, unknown>>(),
    promptText: text("prompt_text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("fix_actions_used_grade_id_idx").on(table.gradeId),
  ],
);

export const creditTransactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    delta: integer("delta").notNull(),
    reason: text("reason").notNull(), // 'signup_bonus' | 'grade' | 'refund' | 'purchase' | 'admin'
    refId: uuid("ref_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("credit_transactions_user_id_idx").on(table.userId),
  ],
);

export const siteSelectors = pgTable(
  "site_selectors",
  {
    id: text("id").primaryKey(),
    version: integer("version").notNull(),
    content: jsonb("content").$type<Record<string, unknown>>().notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    props: jsonb("props").$type<Record<string, unknown>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("events_name_idx").on(table.name),
    index("events_user_id_idx").on(table.userId),
  ],
);

export const realResults = pgTable(
  "real_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
    checkpoint: text("checkpoint").notNull(),
    lecturerFeedback: text("lecturer_feedback").notNull(),
    actualScore: text("actual_score"),
    questionsAsked: jsonb("questions_asked").$type<string[]>().default([]).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("real_results_project_id_idx").on(table.projectId),
    index("real_results_user_id_idx").on(table.userId),
  ],
);

export const studioSessions = pgTable(
  "studio_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    entry: text("entry").notNull(), // 'A' | 'B' | 'C'
    answers: jsonb("answers").$type<Record<string, unknown>>().default({}).notNull(),
    suggestions: jsonb("suggestions").$type<Record<string, unknown>>().default({}).notNull(),
    chosen: jsonb("chosen").$type<Record<string, unknown>>().default({}).notNull(),
    ...timestamps,
  },
  (table) => [
    index("studio_sessions_user_id_idx").on(table.userId),
  ],
);

export const sectionIntakes = pgTable(
  "section_intakes",
  {
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    sectionId: text("section_id").notNull(),
    answers: jsonb("answers").$type<Record<string, unknown>>().default({}).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.sectionId] }),
  ],
);

export const projectSections = pgTable(
  "project_sections",
  {
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    sectionId: text("section_id").notNull(),
    status: text("status").default("todo").notNull(), // 'todo' | 'drafting' | 'passed'
    savedText: text("saved_text"),
    savedGradeId: uuid("saved_grade_id"),
    chatUrl: text("chat_url"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.sectionId] }),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    sectionId: text("section_id"),
    title: text("title").notNull(),
    source: text("source").default("intake").notNull(), // 'intake' | 'fix_action'
    done: boolean("done").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("tasks_project_id_idx").on(table.projectId),
  ],
);

export const projectMembers = pgTable(
  "project_members",
  {
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").default("member").notNull(), // 'owner' | 'member'
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.userId] }),
    index("project_members_user_id_idx").on(table.userId),
  ],
);

export const projectInvites = pgTable(
  "project_invites",
  {
    token: text("token").primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedBy: uuid("used_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("project_invites_project_id_idx").on(table.projectId),
  ],
);

export const teamPasses = pgTable(
  "team_passes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    packId: text("pack_id").notNull(),
    boughtBy: uuid("bought_by")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    price: integer("price").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).defaultNow().notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    gradeCap: integer("grade_cap").default(150).notNull(),
    gradesUsed: integer("grades_used").default(0).notNull(),
    fullCheckCap: integer("full_check_cap").default(3).notNull(),
    fullChecksUsed: integer("full_checks_used").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("team_passes_project_id_idx").on(table.projectId),
  ],
);

export const fullChecks = pgTable(
  "full_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    sectionIds: jsonb("section_ids").$type<string[]>().default([]).notNull(),
    result: jsonb("result").$type<Record<string, unknown>>().notNull(),
    promptVersion: text("prompt_version").default("v2").notNull(),
    model: text("model").notNull(),
    creditsSpent: integer("credits_spent").default(5).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("full_checks_project_id_idx").on(table.projectId),
  ],
);

export const examples = pgTable(
  "examples",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    course: text("course").notNull(), // 'EXE101'
    checkpoint: text("checkpoint").notNull(), // 'Checkpoint 2'
    sectionKey: text("section_key").notNull(), // 'problem', 'customer', 'solution', 'revenue'
    criterionKey: text("criterion_key").notNull(), // 'specificity', 'urgency', etc.
    level: text("level").default("TOT").notNull(), // 'TOT' | 'DAT'
    reportedScore: text("reported_score"), // '9.5', '10'
    excerpt: text("excerpt").notNull(), // Short 1-3 sentences from high scoring proposal
    whyGood: text("why_good").notNull(), // Formula/explanation e.g. "1 nhóm · 1 nơi · 1 hành vi đếm được"
    sourceType: text("source_type").default("senior").notNull(), // 'senior' | 'public' | 'lecturer'
    consent: boolean("consent").default(true).notNull(),
    anonymized: boolean("anonymized").default(true).notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("examples_course_idx").on(table.course),
    index("examples_checkpoint_idx").on(table.checkpoint),
    index("examples_section_key_idx").on(table.sectionKey),
    index("examples_criterion_key_idx").on(table.criterionKey),
    index("examples_level_idx").on(table.level),
  ],
);

