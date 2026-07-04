/*
# CAYIM - Conversations and Enhanced Reports

## Overview
Adds conversation memory for the AI Business Mentor and extends startup reports
with comprehensive market research, competitor analysis, branding, content strategy,
and viral marketing components.

## 1. New Tables

### conversations
Stores chat history between user and AI mentor for conversational memory.
- `id` (uuid PK)
- `user_id` (uuid FK -> auth.users, default auth.uid())
- `context` (jsonb) - collected user context (goals, skills, budget, etc.)
- `context_complete` (boolean) - whether enough context has been gathered
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### conversation_messages
Individual messages within a conversation.
- `id` (uuid PK)
- `conversation_id` (uuid FK -> conversations)
- `role` (text) - 'user' or 'assistant'
- `content` (text) - message content
- `created_at` (timestamptz)

### generated_ideas
Stores AI-generated startup ideas (multiple per conversation).
- `id` (uuid PK)
- `conversation_id` (uuid FK -> conversations)
- `user_id` (uuid FK -> auth.users, default auth.uid())
- `idea_index` (integer) - which of the 5 ideas (1-5)
- `idea_type` (text) - AI, SaaS, E-commerce, Local Business, Services, etc.
- Business details, market research, branding, content strategy (jsonb fields)
- `created_at` (timestamptz)

## 2. Modified Tables

### startup_vault
Adds new columns for enhanced report fields:
- `market_research` (jsonb) - deep market research data
- `target_audience` (jsonb) - detailed target audience profile
- `competitor_analysis` (jsonb) - extended competitor data
- `usp` (jsonb) - unique selling proposition details
- `revenue_model` (jsonb) - extended revenue model
- `roi_estimate` (jsonb) - ROI projections
- `startup_roadmap` (jsonb) - detailed startup roadmap
- `required_skills` (jsonb) - skills and tools needed
- `funding_options` (jsonb) - funding opportunities
- `hackathons` (jsonb) - relevant hackathons
- `communities` (jsonb) - communities to join
- `branding` (jsonb) - branding suggestions and logo prompts
- `landing_page` (jsonb) - landing page copy and design
- `instagram_strategy` (jsonb) - full Instagram content strategy
- `viral_reels` (jsonb) - 3 viral Reel ideas with scripts

## 3. Security
- RLS enabled on all new tables
- Owner-scoped CRUD for authenticated users
- DEFAULT auth.uid() on user_id columns for seamless inserts
*/

-- ---------- conversations ----------
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  context jsonb DEFAULT '{}'::jsonb,
  context_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_conversations" ON conversations;
CREATE POLICY "select_own_conversations"
  ON conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_conversations" ON conversations;
CREATE POLICY "insert_own_conversations"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_conversations" ON conversations;
CREATE POLICY "update_own_conversations"
  ON conversations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_conversations" ON conversations;
CREATE POLICY "delete_own_conversations"
  ON conversations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------- conversation_messages ----------
CREATE TABLE IF NOT EXISTS conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON conversation_messages;
CREATE POLICY "select_own_messages"
  ON conversation_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = conversation_messages.conversation_id AND conversations.user_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_messages" ON conversation_messages;
CREATE POLICY "insert_own_messages"
  ON conversation_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = conversation_messages.conversation_id AND conversations.user_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_messages" ON conversation_messages;
CREATE POLICY "delete_own_messages"
  ON conversation_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = conversation_messages.conversation_id AND conversations.user_id = auth.uid()));

-- ---------- generated_ideas ----------
CREATE TABLE IF NOT EXISTS generated_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  idea_index integer NOT NULL CHECK (idea_index >= 1 AND idea_index <= 5),
  idea_type text NOT NULL,
  title text NOT NULL,
  summary text,
  market_research jsonb,
  target_audience jsonb,
  competitor_analysis jsonb,
  usp jsonb,
  revenue_model jsonb,
  roi_estimate jsonb,
  startup_roadmap jsonb,
  required_skills jsonb,
  funding_options jsonb,
  hackathons jsonb,
  communities jsonb,
  branding jsonb,
  landing_page jsonb,
  instagram_strategy jsonb,
  viral_reels jsonb,
  full_report jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE generated_ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ideas" ON generated_ideas;
CREATE POLICY "select_own_ideas"
  ON generated_ideas FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_ideas" ON generated_ideas;
CREATE POLICY "insert_own_ideas"
  ON generated_ideas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_ideas" ON generated_ideas;
CREATE POLICY "update_own_ideas"
  ON generated_ideas FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ideas" ON generated_ideas;
CREATE POLICY "delete_own_ideas"
  ON generated_ideas FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------- Add columns to startup_vault ----------
ALTER TABLE startup_vault DROP COLUMN IF EXISTS market_research;
ALTER TABLE startup_vault DROP COLUMN IF EXISTS target_audience;
ALTER TABLE startup_vault DROP COLUMN IF EXISTS competitor_analysis_ext;
ALTER TABLE startup_vault DROP COLUMN IF EXISTS usp;
ALTER TABLE startup_vault DROP COLUMN IF EXISTS revenue_model_ext;
ALTER TABLE startup_vault DROP COLUMN IF EXISTS roi_estimate;
ALTER TABLE startup_vault DROP COLUMN IF EXISTS startup_roadmap;
ALTER TABLE startup_vault DROP COLUMN IF EXISTS required_skills;
ALTER TABLE startup_vault DROP COLUMN IF EXISTS funding_options;
ALTER TABLE startup_vault DROP COLUMN IF EXISTS hackathons;
ALTER TABLE startup_vault DROP COLUMN IF EXISTS communities;
ALTER TABLE startup_vault DROP COLUMN IF EXISTS branding;
ALTER TABLE startup_vault DROP COLUMN IF EXISTS landing_page;
ALTER TABLE startup_vault DROP COLUMN IF EXISTS instagram_strategy;
ALTER TABLE startup_vault DROP COLUMN IF EXISTS viral_reels;

ALTER TABLE startup_vault ADD COLUMN market_research jsonb;
ALTER TABLE startup_vault ADD COLUMN target_audience jsonb;
ALTER TABLE startup_vault ADD COLUMN competitor_analysis_ext jsonb;
ALTER TABLE startup_vault ADD COLUMN usp jsonb;
ALTER TABLE startup_vault ADD COLUMN revenue_model_ext jsonb;
ALTER TABLE startup_vault ADD COLUMN roi_estimate jsonb;
ALTER TABLE startup_vault ADD COLUMN startup_roadmap jsonb;
ALTER TABLE startup_vault ADD COLUMN required_skills jsonb;
ALTER TABLE startup_vault ADD COLUMN funding_options jsonb;
ALTER TABLE startup_vault ADD COLUMN hackathons jsonb;
ALTER TABLE startup_vault ADD COLUMN communities jsonb;
ALTER TABLE startup_vault ADD COLUMN branding jsonb;
ALTER TABLE startup_vault ADD COLUMN landing_page jsonb;
ALTER TABLE startup_vault ADD COLUMN instagram_strategy jsonb;
ALTER TABLE startup_vault ADD COLUMN viral_reels jsonb;

-- ---------- Indexes ----------
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conv ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_generated_ideas_user ON generated_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_ideas_conv ON generated_ideas(conversation_id);
