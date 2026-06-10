-- MindForge Initial Schema
-- Run in Supabase SQL Editor

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- TABLES
-- ============================================================

-- users (mirrors auth.users)
CREATE TABLE public.users (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT NOT NULL,
  display_name         TEXT,
  avatar_url           TEXT,
  tier                 TEXT NOT NULL DEFAULT 'free'    CHECK (tier IN ('free', 'pro', 'elite')),
  onboarding_step      TEXT NOT NULL DEFAULT 'mirror'  CHECK (onboarding_step IN ('mirror', 'why', 'environment', 'complete')),
  onboarding_complete  BOOLEAN NOT NULL DEFAULT false,
  why_statement        TEXT,
  identity_declaration TEXT,
  coach_intensity      TEXT NOT NULL DEFAULT 'hard'    CHECK (coach_intensity IN ('hard', 'firm')),
  timezone             TEXT NOT NULL DEFAULT 'UTC',
  environment_audit    JSONB NOT NULL DEFAULT '[]',
  forge_score          INTEGER NOT NULL DEFAULT 0,
  xp                  INTEGER NOT NULL DEFAULT 0,
  level               INTEGER NOT NULL DEFAULT 1,
  current_streak_days  INTEGER NOT NULL DEFAULT 0,
  is_deleted           BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- subscriptions
CREATE TABLE public.subscriptions (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lemonsqueezy_customer_id     TEXT UNIQUE,
  lemonsqueezy_subscription_id TEXT UNIQUE,
  tier                         TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'elite')),
  status                       TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'expired')),
  current_period_end           TIMESTAMPTZ,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- habits
CREATE TABLE public.habits (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL CHECK (char_length(name) <= 60),
  category         TEXT NOT NULL CHECK (category IN ('health', 'mind', 'avoid', 'perform')),
  habit_type       TEXT NOT NULL CHECK (habit_type IN ('build', 'avoid')),
  target_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (target_frequency IN ('daily', 'weekdays', 'custom')),
  target_days      INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- habit_completions
CREATE TABLE public.habit_completions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id        UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  local_date      DATE NOT NULL,
  completed       BOOLEAN NOT NULL,
  notes           TEXT,
  completion_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(habit_id, local_date)
);

-- habit_streaks (cache table)
CREATE TABLE public.habit_streaks (
  habit_id            UUID PRIMARY KEY REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_streak      INTEGER NOT NULL DEFAULT 0,
  longest_streak      INTEGER NOT NULL DEFAULT 0,
  last_completed_date DATE,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- daily_checkins
CREATE TABLE public.daily_checkins (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  local_date        DATE NOT NULL,
  raw_reflection    TEXT NOT NULL,
  ai_response       TEXT,
  mood_signal       TEXT CHECK (mood_signal IN ('excusing', 'deflecting', 'owning', 'crushing')),
  honesty_score     INTEGER CHECK (honesty_score BETWEEN 1 AND 10),
  forge_score_delta INTEGER NOT NULL DEFAULT 0,
  onboarding_mirror BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Partial unique: allows one mirror + one real check-in on the same day
  UNIQUE NULLS NOT DISTINCT (user_id, local_date) DEFERRABLE INITIALLY DEFERRED
);

-- Remove the default unique and add partial unique instead
ALTER TABLE public.daily_checkins DROP CONSTRAINT IF EXISTS daily_checkins_user_id_local_date_key;
CREATE UNIQUE INDEX daily_checkins_real_unique_idx
  ON public.daily_checkins (user_id, local_date)
  WHERE (onboarding_mirror = false);

-- coaching_sessions
CREATE TABLE public.coaching_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  checkin_id        UUID REFERENCES public.daily_checkins(id),
  session_type      TEXT NOT NULL CHECK (session_type IN ('onboarding_mirror', 'why_excavation', 'daily_checkin', 'forty_percent_rule', 'direct_chat')),
  messages          JSONB NOT NULL DEFAULT '[]',
  session_summary   TEXT,
  forge_score_delta INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_memories
CREATE TABLE public.user_memories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  memory_type  TEXT NOT NULL CHECK (memory_type IN ('preference', 'trigger', 'victory', 'fear', 'identity', 'pattern')),
  embedding    vector(768),
  last_accessed TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- cookie_jar_entries
CREATE TABLE public.cookie_jar_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL CHECK (char_length(title) <= 80),
  description     TEXT NOT NULL CHECK (char_length(description) <= 500),
  date_of_victory DATE,
  embedding       vector(768),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- challenges
CREATE TABLE public.challenges (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  difficulty       INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  category         TEXT NOT NULL CHECK (category IN ('cold', 'screen', 'physical', 'fast', 'social')),
  duration_minutes INTEGER NOT NULL,
  xp_reward        INTEGER NOT NULL DEFAULT 100,
  is_active        BOOLEAN NOT NULL DEFAULT true
);

-- user_challenges
CREATE TABLE public.user_challenges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id),
  status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  reflection   TEXT,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
  -- No unique constraint on (user_id, challenge_id) — completed challenges can be repeated
);

-- xp_events
CREATE TABLE public.xp_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  xp_amount  INTEGER NOT NULL,
  reason     TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('habit_complete', 'checkin', 'checkin_bonus', 'challenge', 'forty_percent', 'cookie_jar', 'environment', 'onboarding')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- user_badges
CREATE TABLE public.user_badges (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL CHECK (badge_key IN ('identity_locked', 'mirror_gazer', 'cookie_jar_founder', 'forty_percent_survivor', 'cold_mind', 'tempered')),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);

-- rule_forty_events
CREATE TABLE public.rule_forty_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('auto_habit', 'auto_checkin', 'manual')),
  habit_id     UUID REFERENCES public.habits(id),
  choice       TEXT NOT NULL CHECK (choice IN ('took_step', 'declined')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- forge_score_history
CREATE TABLE public.forge_score_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score       INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- weekly_reports
CREATE TABLE public.weekly_reports (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start_date         DATE NOT NULL,
  forge_score_change      INTEGER NOT NULL DEFAULT 0,
  habit_completion_rate   INTEGER NOT NULL DEFAULT 0,
  best_streak_this_week   TEXT,
  behavioral_arc          TEXT,
  key_insight             TEXT,
  next_week_challenge     TEXT,
  email_sent              BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX habits_user_active_idx             ON public.habits (user_id, is_active);
CREATE INDEX habit_completions_habit_date_idx   ON public.habit_completions (habit_id, local_date);
CREATE INDEX habit_completions_user_date_idx    ON public.habit_completions (user_id, local_date);
CREATE INDEX daily_checkins_user_date_idx       ON public.daily_checkins (user_id, local_date);
CREATE INDEX user_memories_user_type_idx        ON public.user_memories (user_id, memory_type);
CREATE INDEX cookie_jar_user_idx                ON public.cookie_jar_entries (user_id);
CREATE INDEX forge_score_history_user_date_idx  ON public.forge_score_history (user_id, recorded_at DESC);
CREATE INDEX rule_forty_events_user_date_idx    ON public.rule_forty_events (user_id, created_at DESC);

-- pgvector IVFFlat indexes (requires data to be loaded before these are useful)
CREATE INDEX memories_embedding_idx  ON public.user_memories       USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX cookie_jar_embedding_idx ON public.cookie_jar_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update users.updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create users row when auth.users record is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_completions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_streaks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_jar_entries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_forty_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forge_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges          ENABLE ROW LEVEL SECURITY;

-- User-data policies (own data only)
CREATE POLICY "Users can only access own data" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access own data" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own data" ON public.habits
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own data" ON public.habit_completions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own data" ON public.habit_streaks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own data" ON public.daily_checkins
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own data" ON public.coaching_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own data" ON public.user_memories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own data" ON public.cookie_jar_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own data" ON public.user_challenges
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own data" ON public.xp_events
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own data" ON public.user_badges
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own data" ON public.rule_forty_events
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own data" ON public.forge_score_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own data" ON public.weekly_reports
  FOR ALL USING (auth.uid() = user_id);

-- challenges: read-only for authenticated users
CREATE POLICY "Authenticated users can read challenges" ON public.challenges
  FOR SELECT USING (auth.role() = 'authenticated');
