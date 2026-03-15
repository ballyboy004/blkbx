-- Add phase to campaign_tasks for phased campaign execution model
-- Phases: preparation | launch | post_release
-- Migration: 20260316_add_campaign_task_phase

ALTER TABLE public.campaign_tasks
  ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'preparation'
  CHECK (phase IN ('preparation', 'launch', 'post_release'));

COMMENT ON COLUMN public.campaign_tasks.phase IS 'Campaign execution phase: preparation, launch, or post_release';
