-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
  briefs_generated_this_month INTEGER NOT NULL DEFAULT 0,
  calendar_connected BOOLEAN NOT NULL DEFAULT false,
  google_refresh_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MEETINGS TABLE
-- ============================================================
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  attendees JSONB NOT NULL DEFAULT '[]',
  location TEXT,
  meeting_link TEXT,
  brief_id UUID,
  brief_status TEXT NOT NULL DEFAULT 'pending' CHECK (brief_status IN ('pending', 'generating', 'ready', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, google_event_id)
);

-- ============================================================
-- BRIEFS TABLE
-- ============================================================
CREATE TABLE public.briefs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agenda JSONB NOT NULL DEFAULT '[]',
  talking_points JSONB NOT NULL DEFAULT '[]',
  company_snapshot JSONB,
  icebreakers JSONB NOT NULL DEFAULT '[]',
  risk_flags JSONB NOT NULL DEFAULT '[]',
  attendee_summaries JSONB NOT NULL DEFAULT '[]',
  research_quality TEXT NOT NULL DEFAULT 'minimal' CHECK (research_quality IN ('full', 'limited', 'minimal')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_sent_at TIMESTAMPTZ,
  followup_content TEXT,
  followup_generated_at TIMESTAMPTZ
);

-- Add foreign key from meetings.brief_id to briefs.id
ALTER TABLE public.meetings
  ADD CONSTRAINT meetings_brief_id_fkey
  FOREIGN KEY (brief_id) REFERENCES public.briefs(id) ON DELETE SET NULL;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Meetings policies
-- Allow public reads by meeting ID (needed for shared brief viewer)
CREATE POLICY "Meetings are publicly readable by ID"
  ON public.meetings FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own meetings"
  ON public.meetings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meetings"
  ON public.meetings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meetings"
  ON public.meetings FOR DELETE
  USING (auth.uid() = user_id);

-- Briefs policies
-- Allow public reads by brief ID (UUID = unguessable share link)
CREATE POLICY "Briefs are publicly readable by ID"
  ON public.briefs FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own briefs"
  ON public.briefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own briefs"
  ON public.briefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own briefs"
  ON public.briefs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own briefs"
  ON public.briefs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: Auto-create user profile on auth.users insert
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- FUNCTION: Increment brief count for a user
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_brief_count(user_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET briefs_generated_this_month = briefs_generated_this_month + 1
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: Reset monthly brief counts (run via cron)
-- ============================================================

CREATE OR REPLACE FUNCTION public.reset_monthly_brief_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.users SET briefs_generated_this_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX meetings_user_id_idx ON public.meetings (user_id);
CREATE INDEX meetings_start_time_idx ON public.meetings (start_time);
CREATE INDEX briefs_meeting_id_idx ON public.briefs (meeting_id);
CREATE INDEX briefs_user_id_idx ON public.briefs (user_id);
