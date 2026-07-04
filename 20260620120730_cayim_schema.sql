/*
# CAYIM - App schema

## Overview
CAYIM (Cash Made With AI by Young Intelligent Minds) helps users discover
AI-generated business ideas, startup plans, marketing strategies, SWOT
analysis, revenue models, competitor analysis and business roadmaps.

## 1. New Tables

### profiles
- `id` (uuid PK, references auth.users)
- `username` (text, not null)
- `full_name` (text)
- `avatar_url` (text)
- `created_at` (timestamptz)
- Updated via trigger to mirror auth.users email/signup.

### startup_vault
Stores generated startup plans (the "Startup Vault").
- `id` (uuid PK)
- `user_id` (uuid, FK -> auth.users, default auth.uid())
- `title` (text)
- `input_summary` (text) - the survey answers / AI prompt input
- `overview` (jsonb)
- `business` (jsonb)
- `marketing` (jsonb)
- `swot` (jsonb)
- `revenue` (jsonb)
- `competitors` (jsonb)
- `roadmap` (jsonb)
- `tracker` (jsonb)
- `is_favorite` (boolean, default false)
- `created_at` (timestamptz)

### progress_trackers
Lightweight snapshot of tracker checklist completion for quick stats.
- `id` (uuid PK)
- `user_id` (uuid, FK -> auth.users, default auth.uid())
- `vault_id` (uuid, FK -> startup_vault)
- `completed_steps` (integer, default 0)
- `total_steps` (integer, default 7)
- `updated_at` (timestamptz)

## 2. Security
- RLS enabled on all tables.
- profiles: authenticated owner reads + updates own row.
- startup_vault: owner-scoped CRUD (DEFAULT auth.uid() so inserts without
  explicit user_id succeed).
- progress_trackers: owner-scoped CRUD through vault ownership.

## 3. Notes
- `user_id` defaults to `auth.uid()` so the frontend can
  `.insert({ title, ... })` without threading the owner through.
- Triggers keep `profiles` in sync when a new auth user signs up.
*/

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------- startup_vault ----------
CREATE TABLE IF NOT EXISTS startup_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Startup',
  input_summary text,
  overview jsonb,
  business jsonb,
  marketing jsonb,
  swot jsonb,
  revenue jsonb,
  competitors jsonb,
  roadmap jsonb,
  tracker jsonb,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE startup_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_startups" ON startup_vault;
CREATE POLICY "select_own_startups"
  ON startup_vault FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_startups" ON startup_vault;
CREATE POLICY "insert_own_startups"
  ON startup_vault FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_startups" ON startup_vault;
CREATE POLICY "update_own_startups"
  ON startup_vault FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_startups" ON startup_vault;
CREATE POLICY "delete_own_startups"
  ON startup_vault FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------- progress_trackers ----------
CREATE TABLE IF NOT EXISTS progress_trackers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id uuid REFERENCES startup_vault(id) ON DELETE CASCADE,
  completed_steps integer NOT NULL DEFAULT 0,
  total_steps integer NOT NULL DEFAULT 7,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE progress_trackers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_trackers" ON progress_trackers;
CREATE POLICY "select_own_trackers"
  ON progress_trackers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_trackers" ON progress_trackers;
CREATE POLICY "insert_own_trackers"
  ON progress_trackers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_trackers" ON progress_trackers;
CREATE POLICY "update_own_trackers"
  ON progress_trackers FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_trackers" ON progress_trackers;
CREATE POLICY "delete_own_trackers"
  ON progress_trackers FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------- trigger: auto-create profile on signup ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username',
             split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
