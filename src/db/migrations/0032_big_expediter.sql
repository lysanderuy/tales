ALTER TABLE "events" ADD COLUMN "end_time" time;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_end_time_check" CHECK ("events"."end_time" is null or "events"."time" is not null);