UPDATE "profiles"
SET "display_name" = left(split_part("email", '@', 1), 60)
WHERE "display_name" IS NULL OR btrim("display_name") = '';
--> statement-breakpoint
UPDATE "profiles"
SET "display_name" = left("display_name", 60)
WHERE char_length("display_name") > 60;
