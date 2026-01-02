-- Migration: Add task guide for interactive task expansion
-- Date: 2026-01-02
-- Purpose: Store detailed step-by-step guide for priority task

-- ============================================================================
-- ADD TASK GUIDE COLUMN
-- ============================================================================

ALTER TABLE public.interpretations
ADD COLUMN IF NOT EXISTS priority_task_guide jsonb;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- This migration adds interactive task guide to support expandable tasks.
--
-- New column:
-- - priority_task_guide: JSONB object with structure:
--   {
--     "what": "What they're doing (1-2 sentences)",
--     "how": ["Step 1", "Step 2", "Step 3..."],
--     "why": "Why this approach works for them (2-3 sentences)"
--   }
--
-- Guide provides detailed breakdown when user clicks to expand task.
-- No additional API calls needed - generated with dashboard intelligence.
--
-- ============================================================================
