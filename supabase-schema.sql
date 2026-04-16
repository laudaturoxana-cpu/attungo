-- ═══════════════════════════════════════════════
-- SCHEMA COMPLETĂ ATTUNGO — SUPABASE / POSTGRESQL
-- Rulează în Supabase SQL Editor: Settings > SQL Editor
-- ═══════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────
-- TABELUL PĂRINȚILOR
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  language_preference TEXT DEFAULT 'ro' CHECK (language_preference IN ('ro','en')),
  subscription_plan TEXT DEFAULT 'trial'
    CHECK (subscription_plan IN ('trial','essential','family','annual','cancelled')),
  subscription_status TEXT DEFAULT 'active'
    CHECK (subscription_status IN ('active','cancelled','past_due','paused')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────
-- TABELUL COPIILOR
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age BETWEEN 6 AND 15),
  grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 8),
  curriculum_type TEXT NOT NULL
    CHECK (curriculum_type IN ('RO_NATIONAL','US_COMMON_CORE','EN_CAMBRIDGE','US_HOMESCHOOL')),
  session_language TEXT NOT NULL CHECK (session_language IN ('ro','en')),
  atto_color TEXT DEFAULT '#E8A020',
  atto_name TEXT DEFAULT 'Atto',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────
-- PROFILUL DINAMIC AL COPILULUI
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE UNIQUE,

  -- Stiluri de învățare (0.0-1.0)
  learning_visual      FLOAT DEFAULT 0.5 CHECK (learning_visual BETWEEN 0 AND 1),
  learning_auditory    FLOAT DEFAULT 0.5 CHECK (learning_auditory BETWEEN 0 AND 1),
  learning_logical     FLOAT DEFAULT 0.5 CHECK (learning_logical BETWEEN 0 AND 1),
  learning_kinesthetic FLOAT DEFAULT 0.5 CHECK (learning_kinesthetic BETWEEN 0 AND 1),

  -- Pasiuni detectate (counter)
  passion_sport    INTEGER DEFAULT 0,
  passion_music    INTEGER DEFAULT 0,
  passion_tech     INTEGER DEFAULT 0,
  passion_stories  INTEGER DEFAULT 0,
  passion_animals  INTEGER DEFAULT 0,
  passion_art      INTEGER DEFAULT 0,
  passion_science  INTEGER DEFAULT 0,
  passion_other    JSONB DEFAULT '{}',

  -- Anchore pozitive
  positive_anchors TEXT[] DEFAULT '{}',

  -- Greșeli frecvente per materie
  common_mistakes JSONB DEFAULT '{}',

  -- Starea emoțională curentă
  current_energy      TEXT DEFAULT 'medium' CHECK (current_energy IN ('low','medium','high')),
  current_frustration FLOAT DEFAULT 0.0 CHECK (current_frustration BETWEEN 0 AND 1),
  current_engagement  FLOAT DEFAULT 0.8 CHECK (current_engagement BETWEEN 0 AND 1),

  -- Statistici
  total_sessions     INTEGER DEFAULT 0,
  total_minutes      INTEGER DEFAULT 0,
  streak_days        INTEGER DEFAULT 0,
  last_session_at    TIMESTAMPTZ,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────
-- ZPD TRACKING
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zpd_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  concept TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK (status IN ('can_do_alone','with_help','not_yet','mastered')),
  attempts INTEGER DEFAULT 0,
  successful_attempts INTEGER DEFAULT 0,
  last_attempted_at TIMESTAMPTZ DEFAULT NOW(),
  mastered_at TIMESTAMPTZ,
  UNIQUE(child_id, subject, concept)
);

-- ───────────────────────────────────────────────
-- SESIUNILE
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  curriculum_type TEXT NOT NULL,
  session_language TEXT NOT NULL,
  session_type TEXT DEFAULT 'new_concept'
    CHECK (session_type IN ('new_concept','review','test','exploration','free')),

  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- Metrici sesiune
  questions_asked_by_atto   INTEGER DEFAULT 0,
  direct_answers_given      INTEGER DEFAULT 0,
  reframes_used             INTEGER DEFAULT 0,
  style_switches            INTEGER DEFAULT 0,
  concepts_attempted        TEXT[] DEFAULT '{}',
  concepts_mastered_today   TEXT[] DEFAULT '{}',
  breaks_taken              INTEGER DEFAULT 0,

  -- Starea emoțională
  start_energy    TEXT,
  end_energy      TEXT,
  peak_frustration FLOAT DEFAULT 0.0,
  avg_engagement  FLOAT DEFAULT 0.8,

  -- Pasiuni detectate
  passion_signals JSONB DEFAULT '{}',

  -- Flag-uri
  had_safety_concern    BOOLEAN DEFAULT FALSE,
  parent_notified       BOOLEAN DEFAULT FALSE,
  session_completed     BOOLEAN DEFAULT FALSE
);

-- ───────────────────────────────────────────────
-- MESAJELE
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('atto','child')),
  content TEXT NOT NULL,
  audio_url TEXT,
  is_voice_input BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────
-- MEMORIA CONVERSAȚIILOR (pgvector)
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  memory_type TEXT DEFAULT 'session_summary'
    CHECK (memory_type IN ('session_summary','concept_mastered','passion_signal','anchor')),
  embedding vector(768),
  importance_score FLOAT DEFAULT 0.5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversation_memory_embedding_idx
  ON conversation_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ───────────────────────────────────────────────
-- RAPOARTE PENTRU PĂRINȚI
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parent_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  report_date DATE DEFAULT CURRENT_DATE,
  report_type TEXT DEFAULT 'session' CHECK (report_type IN ('session','weekly','monthly')),

  summary TEXT NOT NULL,
  concepts_learned    TEXT[] DEFAULT '{}',
  concepts_struggling TEXT[] DEFAULT '{}',
  passions_detected   TEXT[] DEFAULT '{}',
  atto_message_to_parent TEXT,
  next_session_recommendation TEXT,

  engagement_score FLOAT,
  progress_score   FLOAT,

  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────
-- ABONAMENTELE STRIPE
-- ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('essential','family','annual')),
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  amount_eur DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ───────────────────────────────────────────────
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zpd_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Parents pot vedea/modifica doar propriile date
-- (DROP first to allow re-running the script safely)
DROP POLICY IF EXISTS "parents_own_data" ON parents;
DROP POLICY IF EXISTS "parents_own_children" ON children;
DROP POLICY IF EXISTS "parents_own_profiles" ON child_profiles;
DROP POLICY IF EXISTS "parents_own_zpd" ON zpd_tracking;
DROP POLICY IF EXISTS "parents_own_sessions" ON sessions;
DROP POLICY IF EXISTS "parents_own_messages" ON messages;
DROP POLICY IF EXISTS "parents_own_reports" ON parent_reports;
DROP POLICY IF EXISTS "parents_own_memory" ON conversation_memory;
DROP POLICY IF EXISTS "parents_own_subscriptions" ON subscriptions;

CREATE POLICY "parents_own_data" ON parents
  FOR ALL USING (id = auth.uid());

CREATE POLICY "parents_own_children" ON children
  FOR ALL USING (parent_id = auth.uid());

CREATE POLICY "parents_own_profiles" ON child_profiles
  FOR ALL USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

CREATE POLICY "parents_own_zpd" ON zpd_tracking
  FOR ALL USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

CREATE POLICY "parents_own_sessions" ON sessions
  FOR ALL USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

CREATE POLICY "parents_own_messages" ON messages
  FOR ALL USING (
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN children c ON s.child_id = c.id
      WHERE c.parent_id = auth.uid()
    )
  );

CREATE POLICY "parents_own_reports" ON parent_reports
  FOR ALL USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

CREATE POLICY "parents_own_memory" ON conversation_memory
  FOR ALL USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

CREATE POLICY "parents_own_subscriptions" ON subscriptions
  FOR ALL USING (parent_id = auth.uid());

-- ───────────────────────────────────────────────
-- FUNCȚII AUTOMATE
-- ───────────────────────────────────────────────

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_parents_updated_at
  BEFORE UPDATE ON parents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON child_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-creare profil la adăugarea unui copil
CREATE OR REPLACE FUNCTION create_child_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO child_profiles (child_id) VALUES (NEW.id)
  ON CONFLICT (child_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER auto_create_profile
  AFTER INSERT ON children
  FOR EACH ROW EXECUTE FUNCTION create_child_profile();

-- Actualizare statistici după sesiune completată
CREATE OR REPLACE FUNCTION update_stats_after_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_completed = TRUE AND OLD.session_completed = FALSE THEN
    UPDATE child_profiles
    SET
      total_sessions = total_sessions + 1,
      total_minutes = total_minutes + COALESCE(NEW.duration_minutes, 0),
      last_session_at = NOW(),
      current_frustration = 0.0,
      current_energy = COALESCE(NEW.end_energy, 'medium')
    WHERE child_id = NEW.child_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER session_completed_trigger
  AFTER UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_stats_after_session();
