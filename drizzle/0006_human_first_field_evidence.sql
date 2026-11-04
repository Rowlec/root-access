ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "workspace_mode" text DEFAULT 'human' NOT NULL;--> statement-breakpoint
ALTER TABLE "project_sections" ADD COLUMN IF NOT EXISTS "scaffold_answers" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "field_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE cascade,
	"section_id" text NOT NULL,
	"interviewee_name" text NOT NULL,
	"interviewee_role" text NOT NULL,
	"context" text NOT NULL,
	"direct_quote" text NOT NULL,
	"key_insight" text NOT NULL,
	"evidence_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "field_evidence_project_id_idx" ON "field_evidence" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "field_evidence_section_id_idx" ON "field_evidence" ("section_id");

