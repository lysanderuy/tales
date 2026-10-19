CREATE TYPE "public"."event_mark" AS ENUM('confident', 'review_again');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('mock_board', 'preboard', 'subject_exam', 'review_center_exam');--> statement-breakpoint
CREATE TABLE "event_covers" (
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	CONSTRAINT "event_covers_pk" PRIMARY KEY("event_id","node_id")
);
--> statement-breakpoint
ALTER TABLE "event_covers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "event_marks" (
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"mark" "event_mark" NOT NULL,
	CONSTRAINT "event_marks_pk" PRIMARY KEY("event_id","node_id")
);
--> statement-breakpoint
ALTER TABLE "event_marks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"type" "event_type" NOT NULL,
	"date" date NOT NULL,
	"time" time,
	"note" text,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_user_id_id_unique" UNIQUE("user_id","id"),
	CONSTRAINT "events_title_check" CHECK (char_length("events"."title") between 1 and 100),
	CONSTRAINT "events_note_check" CHECK ("events"."note" is null or char_length("events"."note") <= 5000)
);
--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "event_covers" ADD CONSTRAINT "event_covers_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_covers" ADD CONSTRAINT "event_covers_event_fk" FOREIGN KEY ("user_id","event_id") REFERENCES "public"."events"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_covers" ADD CONSTRAINT "event_covers_node_fk" FOREIGN KEY ("user_id","node_id") REFERENCES "public"."outline_nodes"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_marks" ADD CONSTRAINT "event_marks_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_marks" ADD CONSTRAINT "event_marks_event_fk" FOREIGN KEY ("user_id","event_id") REFERENCES "public"."events"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_marks" ADD CONSTRAINT "event_marks_node_fk" FOREIGN KEY ("user_id","node_id") REFERENCES "public"."outline_nodes"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_user_date_idx" ON "events" USING btree ("user_id","date");