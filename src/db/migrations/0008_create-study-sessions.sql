CREATE TYPE "public"."method_tag" AS ENUM('lecture_notes', 'personal_notes', 'flashcards', 'questions');--> statement-breakpoint
CREATE TYPE "public"."started_from" AS ENUM('free', 'planned', 'next_up');--> statement-breakpoint
CREATE TABLE "session_pauses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"paused_at" timestamp with time zone NOT NULL,
	"resumed_at" timestamp with time zone,
	CONSTRAINT "session_pauses_resumed_after_paused_check" CHECK ("session_pauses"."resumed_at" > "session_pauses"."paused_at")
);
--> statement-breakpoint
ALTER TABLE "session_pauses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "study_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"node_id" uuid,
	"block_id" uuid,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"planned_minutes" integer,
	"method_tag" "method_tag",
	"note" text,
	"started_from" "started_from" DEFAULT 'free' NOT NULL,
	"last_heartbeat_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_sessions_user_id_id_unique" UNIQUE("user_id","id"),
	CONSTRAINT "study_sessions_ended_after_started_check" CHECK ("study_sessions"."ended_at" > "study_sessions"."started_at"),
	CONSTRAINT "study_sessions_planned_minutes_check" CHECK ("study_sessions"."planned_minutes" is null or "study_sessions"."planned_minutes" > 0),
	CONSTRAINT "study_sessions_note_check" CHECK ("study_sessions"."note" is null or char_length("study_sessions"."note") <= 5000)
);
--> statement-breakpoint
ALTER TABLE "study_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "session_pauses" ADD CONSTRAINT "session_pauses_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_pauses" ADD CONSTRAINT "session_pauses_session_fk" FOREIGN KEY ("user_id","session_id") REFERENCES "public"."study_sessions"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_node_fk" FOREIGN KEY ("user_id","node_id") REFERENCES "public"."outline_nodes"("user_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "session_pauses_one_open_per_session" ON "session_pauses" USING btree ("session_id") WHERE "session_pauses"."resumed_at" is null;--> statement-breakpoint
CREATE INDEX "session_pauses_session_idx" ON "session_pauses" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "study_sessions_one_live_per_user" ON "study_sessions" USING btree ("user_id") WHERE "study_sessions"."ended_at" is null;--> statement-breakpoint
CREATE INDEX "study_sessions_user_started_idx" ON "study_sessions" USING btree ("user_id","started_at");