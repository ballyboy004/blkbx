-- Add release_type to campaigns for new campaign flow
-- Migration: 20260315_add_campaign_release_type

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS release_type text;

COMMENT ON COLUMN public.campaigns.release_type IS 'Single, EP, Album, or Mixtape';
