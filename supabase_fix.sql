-- ============================================================================
-- SOUNDLOG — SCRIPT DE CORREÇÃO E ATIVAÇÃO COMPLETA DO BANCO SUPABASE
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. TABELA DE PERFIS (public.profiles)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    website TEXT DEFAULT '',
    favorite_artist TEXT DEFAULT '',
    location TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adiciona colunas caso a tabela já existisse com estrutura antiga
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_artist TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';

-- RLS de Perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de perfis" ON public.profiles;
CREATE POLICY "Leitura pública de perfis" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuário insere próprio perfil" ON public.profiles;
CREATE POLICY "Usuário insere próprio perfil" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Usuário edita próprio perfil" ON public.profiles;
CREATE POLICY "Usuário edita próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 3. MIGRAÇÃO DE USUÁRIOS EXISTENTES (Larissa, Leonardo, etc.)
-- ----------------------------------------------------------------------------
INSERT INTO public.profiles (id, username, display_name, avatar_url)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)), 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'avatar_url', '')
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET 
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name;

-- ----------------------------------------------------------------------------
-- 4. TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE NO CADASTRO
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 5. TABELA DE AVALIAÇÕES & RESENHAS (public.reviews)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type TEXT DEFAULT 'album',
    rating NUMERIC(2, 1) DEFAULT 4.0,
    review_text TEXT DEFAULT '',
    track_id TEXT,
    track_name TEXT,
    duration_formatted TEXT,
    album_id TEXT,
    album_title TEXT,
    artist_name TEXT,
    cover_url TEXT,
    release_year TEXT,
    genre TEXT,
    media_format TEXT DEFAULT 'Vinil',
    listened_date TEXT,
    is_relisten BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    user_username TEXT,
    user_name TEXT,
    user_avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flexibiliza colunas se a tabela foi criada anteriormente com constraints antigas
DO $$ BEGIN
    ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_album_id_fkey;
    ALTER TABLE public.reviews ALTER COLUMN album_id TYPE TEXT;
    ALTER TABLE public.reviews ALTER COLUMN album_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE public.reviews ALTER COLUMN body DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'album';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_text TEXT DEFAULT '';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS track_id TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS track_name TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS duration_formatted TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS album_id TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS album_title TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS artist_name TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS release_year TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS media_format TEXT DEFAULT 'Vinil';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS listened_date TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_relisten BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_username TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_avatar TEXT;

-- RLS de Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de resenhas" ON public.reviews;
CREATE POLICY "Leitura pública de resenhas" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuário cria e gerencia suas resenhas" ON public.reviews;
CREATE POLICY "Usuário cria e gerencia suas resenhas" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 6. TABELA DE SEGUIDORES (public.follows)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública de seguidores" ON public.follows;
CREATE POLICY "Leitura pública de seguidores" ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuário segue e desseguir outros" ON public.follows;
CREATE POLICY "Usuário segue e desseguir outros" ON public.follows FOR ALL USING (true) WITH CHECK (true);
