CREATE TABLE "outline_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"exam_weight" numeric(4, 1),
	"archived" boolean DEFAULT false NOT NULL,
	"color_index" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outline_nodes_user_id_id_unique" UNIQUE("user_id","id"),
	CONSTRAINT "outline_nodes_name_check" CHECK (char_length("outline_nodes"."name") between 1 and 80 and position('>' in "outline_nodes"."name") = 0),
	CONSTRAINT "outline_nodes_exam_weight_check" CHECK ("outline_nodes"."exam_weight" is null or "outline_nodes"."exam_weight" between 0 and 100),
	CONSTRAINT "outline_nodes_color_index_check" CHECK ("outline_nodes"."color_index" is null or "outline_nodes"."color_index" between 0 and 7)
);
--> statement-breakpoint
ALTER TABLE "outline_nodes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "outline_nodes" ADD CONSTRAINT "outline_nodes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outline_nodes" ADD CONSTRAINT "outline_nodes_parent_fk" FOREIGN KEY ("user_id","parent_id") REFERENCES "public"."outline_nodes"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "outline_nodes_sibling_name_unique" ON "outline_nodes" USING btree ("user_id",coalesce("parent_id", '00000000-0000-0000-0000-000000000000'::uuid),lower("name"));--> statement-breakpoint
CREATE INDEX "outline_nodes_user_parent_position_idx" ON "outline_nodes" USING btree ("user_id","parent_id","position");