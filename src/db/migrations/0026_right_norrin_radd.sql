CREATE INDEX "daily_set_activation_set_idx" ON "daily_set_activation" USING btree ("set_id");--> statement-breakpoint
CREATE INDEX "daily_sets_owner_idx" ON "daily_sets" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "event_covers_node_idx" ON "event_covers" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "event_marks_node_idx" ON "event_marks" USING btree ("node_id");--> statement-breakpoint
CREATE INDEX "template_items_node_idx" ON "template_items" USING btree ("node_id");