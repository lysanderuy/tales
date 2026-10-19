CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  meta_zone text := nullif(trim(NEW.raw_user_meta_data->>'time_zone'), '');
BEGIN
  INSERT INTO public.profiles (id, email, display_name, time_zone)
  VALUES (
    NEW.id,
    NEW.email,
    left(
      coalesce(
        nullif(trim(NEW.raw_user_meta_data->>'display_name'), ''),
        nullif(split_part(NEW.email, '@', 1), ''),
        'Student'
      ),
      60
    ),
    coalesce(
      (SELECT name FROM pg_catalog.pg_timezone_names WHERE name = meta_zone LIMIT 1),
      'Asia/Manila'
    )
  );
  RETURN NEW;
END;
$$;
