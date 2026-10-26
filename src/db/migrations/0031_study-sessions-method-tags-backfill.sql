UPDATE study_sessions SET method_tags = ARRAY[method_tag] WHERE method_tag IS NOT NULL AND method_tags = '{}';
