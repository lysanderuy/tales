CREATE TABLE "template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"time_of_day" time,
	"planned_minutes" integer,
	"position" integer NOT NULL,
	CONSTRAINT "template_items_user_id_id_unique" UNIQUE("user_id","id"),
	CONSTRAINT "template_items_planned_minutes_check" CHECK ("template_items"."planned_minutes" is null or "template_items"."planned_minutes" between 1 and 720)
);
--> statement-breakpoint
ALTER TABLE "template_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "templates_user_id_id_unique" UNIQUE("user_id","id"),
	CONSTRAINT "templates_name_check" CHECK (char_length("templates"."name") between 1 and 60)
);
--> statement-breakpoint
ALTER TABLE "templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "template_items" ADD CONSTRAINT "template_items_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_items" ADD CONSTRAINT "template_items_template_fk" FOREIGN KEY ("user_id","template_id") REFERENCES "public"."templates"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_items" ADD CONSTRAINT "template_items_node_fk" FOREIGN KEY ("user_id","node_id") REFERENCES "public"."outline_nodes"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "template_items_template_position_idx" ON "template_items" USING btree ("template_id","position");