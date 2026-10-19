ALTER TABLE blocks ADD CONSTRAINT blocks_event_fk FOREIGN KEY (user_id, event_id) REFERENCES events (user_id, id) ON DELETE SET NULL (event_id);
