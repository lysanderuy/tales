CREATE TABLE "daily_line_picks" (
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"line_id" uuid NOT NULL,
	CONSTRAINT "daily_line_picks_user_id_date_pk" PRIMARY KEY("user_id","date")
);
--> statement-breakpoint
ALTER TABLE "daily_line_picks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"set_id" uuid NOT NULL,
	"text" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_lines_text_check" CHECK (char_length("daily_lines"."text") between 1 and 500)
);
--> statement-breakpoint
ALTER TABLE "daily_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_set_activation" (
	"user_id" uuid NOT NULL,
	"set_id" uuid NOT NULL,
	"active" boolean NOT NULL,
	CONSTRAINT "daily_set_activation_user_id_set_id_pk" PRIMARY KEY("user_id","set_id")
);
--> statement-breakpoint
ALTER TABLE "daily_set_activation" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "daily_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid,
	"name" text NOT NULL,
	"built_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_sets_name_check" CHECK (char_length("daily_sets"."name") between 1 and 60),
	CONSTRAINT "daily_sets_built_in_check" CHECK ("daily_sets"."built_in" = ("daily_sets"."owner_id" is null))
);
--> statement-breakpoint
ALTER TABLE "daily_sets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "hidden_lines" (
	"user_id" uuid NOT NULL,
	"line_id" uuid NOT NULL,
	CONSTRAINT "hidden_lines_user_id_line_id_pk" PRIMARY KEY("user_id","line_id")
);
--> statement-breakpoint
ALTER TABLE "hidden_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_line_picks" ADD CONSTRAINT "daily_line_picks_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_line_picks" ADD CONSTRAINT "daily_line_picks_line_id_daily_lines_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."daily_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_lines" ADD CONSTRAINT "daily_lines_set_id_daily_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."daily_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_set_activation" ADD CONSTRAINT "daily_set_activation_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_set_activation" ADD CONSTRAINT "daily_set_activation_set_id_daily_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."daily_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_sets" ADD CONSTRAINT "daily_sets_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hidden_lines" ADD CONSTRAINT "hidden_lines_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hidden_lines" ADD CONSTRAINT "hidden_lines_line_id_daily_lines_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."daily_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_lines_set_position_idx" ON "daily_lines" USING btree ("set_id","position");