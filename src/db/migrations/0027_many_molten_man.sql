ALTER TABLE "study_sessions" ADD COLUMN "event_id" uuid;--> statement-breakpoint
CREATE INDEX "study_sessions_user_event_idx" ON "study_sessions" USING btree ("user_id","event_id");