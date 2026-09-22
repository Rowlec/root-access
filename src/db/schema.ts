import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
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
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email"),
    displayName: text("display_name"),
    role: userRole("role").default("user").notNull(),
    isDisabled: boolean("is_disabled").default(false).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_clerk_user_id_uidx").on(table.clerkUserId)],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    startupIdea: text("startup_idea").notNull(),
    industry: text("industry").notNull(),
    targetCustomer: text("target_customer").default("").notNull(),
    status: projectStatus("status").default("active").notNull(),
    currentSection: text("current_section").default("problem").notNull(),
    progressPercent: integer("progress_percent").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    index("projects_user_id_idx").on(table.userId),
    index("projects_updated_at_idx").on(table.updatedAt),
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
    balance: integer("balance").default(20).notNull(),
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
