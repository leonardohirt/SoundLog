BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_artist TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_genres JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public_reviews BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public_diary BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_followers BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'album';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_username TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_avatar TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS track_id TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS track_name TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS duration_formatted TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS album_title TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS artist_name TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS release_year TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS media_format TEXT DEFAULT 'Vinil';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS listened_date TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_relisten BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.reviews ALTER COLUMN album_id DROP NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN cover_url DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (follower_id, following_id)
);

DO $$
DECLARE
  table_record RECORD;
  policy_record RECORD;
BEGIN
  FOR table_record IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_record.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', table_record.tablename);
    FOR policy_record IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_record.tablename
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', policy_record.policyname, table_record.tablename);
    END LOOP;
  END LOOP;
END;
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.reviews, public.follows TO authenticated;
GRANT SELECT ON public.profiles, public.reviews, public.follows TO anon;

CREATE POLICY profiles_public_read ON public.profiles
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY profiles_owner_insert ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_owner_update ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_owner_delete ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE POLICY reviews_public_read ON public.reviews
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY reviews_owner_insert ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY reviews_owner_update ON public.reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY reviews_owner_delete ON public.reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY follows_public_read ON public.follows
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY follows_owner_insert ON public.follows
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = follower_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = follows.following_id AND profiles.allow_followers = TRUE
    )
  );
CREATE POLICY follows_owner_delete ON public.follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

CREATE OR REPLACE FUNCTION public.set_review_author()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
  auth_record RECORD;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;

  SELECT username, display_name, avatar_url
  INTO profile_record
  FROM public.profiles
  WHERE id = NEW.user_id;

  SELECT email, raw_user_meta_data
  INTO auth_record
  FROM auth.users
  WHERE id = NEW.user_id;

  NEW.user_username := COALESCE(profile_record.username, auth_record.raw_user_meta_data->>'username', split_part(auth_record.email, '@', 1));
  NEW.user_name := COALESCE(profile_record.display_name, auth_record.raw_user_meta_data->>'full_name', NEW.user_username);
  NEW.user_avatar := COALESCE(profile_record.avatar_url, auth_record.raw_user_meta_data->>'avatar_url', '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_set_author ON public.reviews;
CREATE TRIGGER reviews_set_author
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_review_author();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
BEGIN
  base_username := lower(COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  ));

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    base_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', base_username),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMIT;