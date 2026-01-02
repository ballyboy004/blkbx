-- Migration: Add priority task and next actions to interpretations
-- Date: 2026-01-02
-- Purpose: Store intelligent task + next actions, remove generic task system

-- ============================================================================
-- ADD TASK AND NEXT ACTIONS COLUMNS
-- ============================================================================

ALTER TABLE public.interpretations
ADD COLUMN IF NOT EXISTS priority_task_title text,
ADD COLUMN IF NOT EXISTS priority_task_reasoning text,
ADD COLUMN IF NOT EXISTS priority_task_guardrail text,
ADD COLUMN IF NOT EXISTS next_actions jsonb;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- This migration adds intelligent task generation to the interpretations table.
--
-- New columns:
-- - priority_task_title: Specific, personalized task (not generic)
-- - priority_task_reasoning: Why this task matters for THIS user (2-3 sentences)
-- - priority_task_guardrail: Constraint for this specific task
-- - next_actions: Array of 2-3 follow-up actions after priority task
--
-- All columns nullable for backwards compatibility.
-- New intelligence generations will populate all fields.
--
-- ============================================================================
