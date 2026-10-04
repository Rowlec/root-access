CREATE TABLE "examples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course" text NOT NULL,
	"checkpoint" text NOT NULL,
	"section_key" text NOT NULL,
	"criterion_key" text NOT NULL,
	"level" text DEFAULT 'TOT' NOT NULL,
	"reported_score" text,
	"excerpt" text NOT NULL,
	"why_good" text NOT NULL,
	"source_type" text DEFAULT 'senior' NOT NULL,
	"consent" boolean DEFAULT true NOT NULL,
	"anonymized" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wallets" ALTER COLUMN "balance" SET DEFAULT 5;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "target_level" text;--> statement-breakpoint
ALTER TABLE "examples" ADD CONSTRAINT "examples_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "examples_course_idx" ON "examples" USING btree ("course");--> statement-breakpoint
CREATE INDEX "examples_checkpoint_idx" ON "examples" USING btree ("checkpoint");--> statement-breakpoint
CREATE INDEX "examples_section_key_idx" ON "examples" USING btree ("section_key");--> statement-breakpoint
CREATE INDEX "examples_criterion_key_idx" ON "examples" USING btree ("criterion_key");--> statement-breakpoint
CREATE INDEX "examples_level_idx" ON "examples" USING btree ("level");