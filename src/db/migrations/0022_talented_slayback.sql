ALTER TABLE "profiles" ADD COLUMN "theme" text DEFAULT 'light' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_theme_check" CHECK ("profiles"."theme" in ('light', 'dark'));