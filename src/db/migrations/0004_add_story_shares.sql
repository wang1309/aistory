-- Story Share: public read-only snapshot of a generated story.
-- Anonymous-friendly (user_uuid nullable), decoupled from sg_stories.
--
-- Apply via: Supabase SQL Editor, or `psql`, or `drizzle-kit push`.
-- Idempotent (IF NOT EXISTS) so it is safe to run multiple times.
CREATE TABLE IF NOT EXISTS "sg_story_shares" (
	"id" integer GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1) PRIMARY KEY,
	"share_id" varchar(32) NOT NULL,
	"title" varchar(200),
	"content" text NOT NULL,
	"prompt" text,
	"settings" jsonb,
	"source_category" varchar(50),
	"user_uuid" varchar(255),
	"delete_token" varchar(64),
	"status" varchar(20) NOT NULL DEFAULT 'visible',
	"view_count" integer NOT NULL DEFAULT 0,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone
);
CREATE UNIQUE INDEX IF NOT EXISTS "sg_story_shares_share_id_unique_idx" ON "sg_story_shares" ("share_id");
CREATE INDEX IF NOT EXISTS "sg_story_shares_user_created_idx" ON "sg_story_shares" ("user_uuid", "created_at");
CREATE INDEX IF NOT EXISTS "sg_story_shares_status_created_idx" ON "sg_story_shares" ("status", "created_at");
