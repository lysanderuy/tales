UPDATE study_sessions s SET event_id = b.event_id FROM blocks b WHERE s.block_id = b.id AND s.user_id = b.user_id AND s.event_id IS NULL AND b.event_id IS NOT NULL;
