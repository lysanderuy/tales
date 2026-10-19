ALTER TABLE "blocks" DROP CONSTRAINT "blocks_node_fk";
--> statement-breakpoint
ALTER TABLE "study_sessions" DROP CONSTRAINT "study_sessions_node_fk";
--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_node_fk" FOREIGN KEY ("user_id","node_id") REFERENCES "public"."outline_nodes"("user_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_node_fk" FOREIGN KEY ("user_id","node_id") REFERENCES "public"."outline_nodes"("user_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blocks_user_node_idx" ON "blocks" USING btree ("user_id","node_id");--> statement-breakpoint
CREATE INDEX "daily_line_picks_line_idx" ON "daily_line_picks" USING btree ("line_id");--> statement-breakpoint
CREATE INDEX "hidden_lines_line_idx" ON "hidden_lines" USING btree ("line_id");--> statement-breakpoint
CREATE INDEX "study_sessions_user_node_idx" ON "study_sessions" USING btree ("user_id","node_id");--> statement-breakpoint
CREATE INDEX "study_sessions_user_block_idx" ON "study_sessions" USING btree ("user_id","block_id");