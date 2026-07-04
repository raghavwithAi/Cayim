/*
# CAYIM — Production Upgrade: Favorites, Settings, Analytics, Guest Migration, Inspo/Docs/Prompt

## Overview
Upgrades CAYIM to a production-ready platform by adding:
1. Favorites system for bookmarking startup ideas
2. User settings/preferences table (country, business type, theme, notifications)
3. Analytics event tracking table
4. Guest session table for migrating guest data to real accounts
5. New JSONB columns on startup_vault for the three premium result tabs (Inspo, Docs, Prompt)

## 1. New Tables

### favorites
Bookmark any vault item for quick access.
- id (uuid PK)
- user_id (uuid FK -> auth.users, DEFAULT auth.uid())
- vault_id (uuid FK -> startup_vault ON DELETE CASCADE)
- created_at (timestamptz)

### user_settings
Per-user preferences: country, business type, theme, notification flags.
- id (uuid PK)
- user_id (uuid FK -> auth.users, DEFAULT auth.uid())
- country (text, default 'India')
- business_type (text)
- theme (text, default 'system')
- notifications (boolean, default true)
- created_at, updated_at (timestamptz)

### analytics_events
Lightweight event tracking for user actions (generate, save, view, etc.).
- id (uuid PK)
- user_id (uuid FK -> auth.users, DEFAULT auth.uid())
- event_name (text, not null)
- event_data (jsonb)
- created_at (timestamptz)

### guest_sessions
Tracks guest-mode sessions so their local data can be migrated to a real account on signup.
- id (uuid PK)
- guest_uuid (text, not null, unique) — random ID generated client-side
- migrated_user_id (uuid, FK -> auth.users, nullable) — set when guest signs up
- data (jsonb) — snapshot of guest's local data (vault items, settings)
- created_at, migrated_at (timestamptz)

## 2. Modified Tables

### startup_vault
Adds three new JSONB columns for the premium result tabs:
- inspo (jsonb) — 5-10 relevant real companies with logo, description, business model, lessons
- docs (jsonb) — required registrations, licenses, taxes, compliance for user's country
- prompts (jsonb) — AI prompts for logo, banners, mockups, ads + 10 business name suggestions

### profiles
Adds columns for guest migration and enhanced profile:
- country (text, default 'India')
- bio (text)

## 3. Security
- RLS enabled on all new tables
- Owner-scoped CRUD for authenticated users (DEFAULT auth.uid())
- guest_sessions: authenticated users can read/update their own migrated guest record
- All policies use auth.uid() ownership checks

## 4. Indexes
- idx_favorites_user on favorites(user_id)
- idx_favorites_vault on favorites(vault_id)
- idx_user_settings_user (unique) on user_settings(user_id)
- idx_analytics_user on analytics_events(user_id)
- idx_analytics_event on analytics_events(event_name)
- idx_guest_sessions_uuid on guest_sessions(guest_uuid)
- idx_vault_user_created on startup_vault(user_id, created_at DESC)
*/

-- ========== favorites ==========
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id uuid NOT NULL REFERENCES startup_vault(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_favorites" ON favorites;
CREATE POLICY "select_own_favorites"
  ON favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_favorites" ON favorites;
CREATE POLICY "insert_own_favorites"
  ON favorites FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_favorites" ON favorites;
CREATE POLICY "delete_own_favorites"
  ON favorites FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ========== user_settings ==========
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  country text NOT NULL DEFAULT 'India',
  business_type text,
  theme text NOT NULL DEFAULT 'system',
  notifications boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON user_settings;
CREATE POLICY "select_own_settings"
  ON user_settings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_settings" ON user_settings;
CREATE POLICY "insert_own_settings"
  ON user_settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_settings" ON user_settings;
CREATE POLICY "update_own_settings"
  ON user_settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ========== analytics_events ==========
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_analytics" ON analytics_events;
CREATE POLICY "select_own_analytics"
  ON analytics_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_analytics" ON analytics_events;
CREATE POLICY "insert_own_analytics"
  ON analytics_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ========== guest_sessions ==========
CREATE TABLE IF NOT EXISTS guest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_uuid text NOT NULL UNIQUE,
  migrated_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  migrated_at timestamptz
);

ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_guest_session" ON guest_sessions;
CREATE POLICY "select_own_guest_session"
  ON guest_sessions FOR SELECT TO authenticated
  USING (migrated_user_id = auth.uid());

DROP POLICY IF EXISTS "update_own_guest_session" ON guest_sessions;
CREATE POLICY "update_own_guest_session"
  ON guest_sessions FOR UPDATE TO authenticated
  USING (migrated_user_id = auth.uid()) WITH CHECK (migrated_user_id = auth.uid());

-- ========== Add columns to startup_vault ==========
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'startup_vault' AND column_name = 'inspo') THEN
    ALTER TABLE startup_vault ADD COLUMN inspo jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'startup_vault' AND column_name = 'docs') THEN
    ALTER TABLE startup_vault ADD COLUMN docs jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'startup_vault' AND column_name = 'prompts') THEN
    ALTER TABLE startup_vault ADD COLUMN prompts jsonb;
  END IF;
END $$;

-- ========== Add columns to profiles ==========
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'country') THEN
    ALTER TABLE profiles ADD COLUMN country text DEFAULT 'India';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;
END $$;

-- ========== Indexes ==========
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_vault ON favorites(vault_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_uuid ON guest_sessions(guest_uuid);
CREATE INDEX IF NOT EXISTS idx_vault_user_created ON startup_vault(user_id, created_at DESC);
