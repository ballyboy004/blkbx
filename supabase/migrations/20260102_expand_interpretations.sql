-- Migration: Expand interpretations table for full dashboard intelligence
-- Date: 2026-01-02
-- Purpose: Add columns for identity, edge, friction, constraint, strategic context

-- ============================================================================
-- ADD NEW COLUMNS TO interpretations TABLE
-- ============================================================================

ALTER TABLE public.interpretations
ADD COLUMN IF NOT EXISTS identity_summary text,
ADD COLUMN IF NOT EXISTS edge_interpretation text,
ADD COLUMN IF NOT EXISTS friction_interpretation text,
ADD COLUMN IF NOT EXISTS constraint_interpretation text,
ADD COLUMN IF NOT EXISTS strategic_context jsonb;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- This migration expands the interpretations table to store complete
-- dashboard intelligence, not just "Current Read".
--
-- New columns:
-- - identity_summary: Who the artist is (one sentence)
-- - edge_interpretation: Their primary strength (interpreted)
-- - friction_interpretation: What blocks them (clearly named)
-- - constraint_interpretation: Their real limitation (acknowledged)
-- - strategic_context: Array of strategic bullets (JSONB)
--
-- All columns nullable for backwards compatibility with existing rows.
-- New intelligence generations will populate all fields.
--
-- ============================================================================
