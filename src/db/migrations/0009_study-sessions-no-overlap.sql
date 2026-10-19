CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE study_sessions ADD CONSTRAINT study_sessions_no_overlap EXCLUDE USING gist (user_id WITH =, tstzrange(started_at, coalesce(ended_at, 'infinity'::timestamptz), '[)') WITH &&);
