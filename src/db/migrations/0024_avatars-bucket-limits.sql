UPDATE storage.buckets SET file_size_limit = 2097152, allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp'] WHERE id = 'avatars';
