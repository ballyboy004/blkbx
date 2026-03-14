-- BLACKBOX Campaign Module Schema
-- Migration: 20260314_create_campaign_module
-- Adds: campaigns, content_pieces, campaign_tasks, assets
-- Integrates with: public.releases (optional FK), auth.users
-- Does NOT modify any existing tables

-- ============================================================================
-- TABLE: campaigns
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  release_id uuid REFERENCES public.releases(id) ON DELETE SET NULL,
  title text NOT NULL,
  release_date date,
  goals text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- TABLE: content_pieces
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.content_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('strategy', 'press_release', 'email', 'captions')),
  content text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'approved', 'rejected')),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz
);

-- ============================================================================
-- TABLE: campaign_tasks
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'skipped')),
  order_index integer NOT NULL DEFAULT 0,
  due_date date,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ============================================================================
-- TABLE: assets
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text,
  name text NOT NULL,
  url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_content_pieces_campaign_id ON public.content_pieces(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_pieces_campaign_type ON public.content_pieces(campaign_id, type);
CREATE INDEX IF NOT EXISTS idx_campaign_tasks_campaign_id ON public.campaign_tasks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_tasks_order ON public.campaign_tasks(campaign_id, order_index);
CREATE INDEX IF NOT EXISTS idx_assets_campaign_id ON public.assets(campaign_id);

-- ============================================================================
-- RLS: campaigns
-- ============================================================================

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns"
  ON public.campaigns
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns"
  ON public.campaigns
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON public.campaigns
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
  ON public.campaigns
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS: content_pieces
-- ============================================================================

ALTER TABLE public.content_pieces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content_pieces"
  ON public.content_pieces
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content_pieces"
  ON public.content_pieces
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content_pieces"
  ON public.content_pieces
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content_pieces"
  ON public.content_pieces
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS: campaign_tasks
-- ============================================================================

ALTER TABLE public.campaign_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign_tasks"
  ON public.campaign_tasks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaign_tasks"
  ON public.campaign_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaign_tasks"
  ON public.campaign_tasks
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaign_tasks"
  ON public.campaign_tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RLS: assets
-- ============================================================================

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"
  ON public.assets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets"
  ON public.assets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON public.assets
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON public.assets
  FOR DELETE
  USING (auth.uid() = user_id);
