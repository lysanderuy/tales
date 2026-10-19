CREATE TABLE "blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"date" date NOT NULL,
	"time_of_day" time,
	"planned_minutes" integer,
	"position" integer NOT NULL,
	"event_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_user_id_id_unique" UNIQUE("user_id","id"),
	CONSTRAINT "blocks_planned_minutes_check" CHECK ("blocks"."planned_minutes" is null or "blocks"."planned_minutes" between 1 and 720)
);
--> statement-breakpoint
ALTER TABLE "blocks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_node_fk" FOREIGN KEY ("user_id","node_id") REFERENCES "public"."outline_nodes"("user_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blocks_user_date_position_idx" ON "blocks" USING btree ("user_id","date","position");