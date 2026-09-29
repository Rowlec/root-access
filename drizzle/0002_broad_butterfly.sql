CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"ref_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fix_actions_used" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grade_id" uuid NOT NULL,
	"action_id" text NOT NULL,
	"type" text NOT NULL,
	"user_input" jsonb,
	"prompt_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"pack_id" text NOT NULL,
	"pack_version" integer NOT NULL,
	"section_id" text NOT NULL,
	"site" text NOT NULL,
	"output_text" text NOT NULL,
	"output_hash" text NOT NULL,
	"result" jsonb NOT NULL,
	"parent_grade_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packs" (
	"id" text NOT NULL,
	"version" integer NOT NULL,
	"course" text NOT NULL,
	"term" text NOT NULL,
	"checkpoint" text NOT NULL,
	"source" text NOT NULL,
	"content" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "packs_id_version_pk" PRIMARY KEY("id","version")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"credits" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_insertions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"section_id" text NOT NULL,
	"kind" text NOT NULL,
	"prompt_text" text NOT NULL,
	"site" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "real_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"checkpoint" text NOT NULL,
	"lecturer_feedback" text NOT NULL,
	"actual_score" text,
	"questions_asked" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_selectors" (
	"id" text PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"content" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "title" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "startup_idea" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "industry" SET DEFAULT 'Khởi nghiệp';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "idea" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "available_data" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "pack_id" text DEFAULT 'exe101-cp2' NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fix_actions_used" ADD CONSTRAINT "fix_actions_used_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_insertions" ADD CONSTRAINT "prompt_insertions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_insertions" ADD CONSTRAINT "prompt_insertions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_results" ADD CONSTRAINT "real_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "real_results" ADD CONSTRAINT "real_results_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_transactions_user_id_idx" ON "credit_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_name_idx" ON "events" USING btree ("name");--> statement-breakpoint
CREATE INDEX "events_user_id_idx" ON "events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "fix_actions_used_grade_id_idx" ON "fix_actions_used" USING btree ("grade_id");--> statement-breakpoint
CREATE INDEX "grades_project_id_idx" ON "grades" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "grades_user_id_idx" ON "grades" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "grades_parent_grade_id_idx" ON "grades" USING btree ("parent_grade_id");--> statement-breakpoint
CREATE INDEX "packs_is_active_idx" ON "packs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "prompt_insertions_project_id_idx" ON "prompt_insertions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "prompt_insertions_user_id_idx" ON "prompt_insertions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "real_results_project_id_idx" ON "real_results" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "real_results_user_id_idx" ON "real_results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "projects_pack_id_idx" ON "projects" USING btree ("pack_id");--> statement-breakpoint
CREATE OR REPLACE FUNCTION consume_credit(p_user uuid, p_ref uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET credits = credits - 1
  WHERE id = p_user AND credits > 0;
  IF NOT FOUND THEN RETURN false; END IF;
  INSERT INTO credit_transactions(user_id, delta, reason, ref_id)
  VALUES (p_user, -1, 'grade', p_ref);
  RETURN true;
END $$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION refund_credit(p_user uuid, p_ref uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET credits = credits + 1
  WHERE id = p_user;
  INSERT INTO credit_transactions(user_id, delta, reason, ref_id)
  VALUES (p_user, 1, 'refund', p_ref);
  RETURN true;
END $$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION add_credit(p_user uuid, p_delta int, p_reason text, p_ref uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_balance integer;
BEGIN
  UPDATE profiles SET credits = credits + p_delta
  WHERE id = p_user
  RETURNING credits INTO new_balance;
  INSERT INTO credit_transactions(user_id, delta, reason, ref_id)
  VALUES (p_user, p_delta, p_reason, p_ref);
  RETURN new_balance;
END $$;