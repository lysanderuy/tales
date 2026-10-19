ALTER TABLE "profiles" ALTER COLUMN "display_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "school" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "review_center" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "exam_date" date;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "time_zone" text DEFAULT 'Asia/Manila' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "sound_on" boolean DEFAULT true NOT NULL;