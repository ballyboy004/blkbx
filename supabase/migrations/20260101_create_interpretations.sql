-- Migration: Add interpretations table for caching Claude API outputs
-- Date: 2026-01-01
-- Design: BLACKBOX_V1_INTELLIGENCE_LAYER_DESIGN.md

-- ============================================================================
-- TABLE: interpretations
-- ============================================================================
-- Purpose: Cache intelligent interpretations to minimize API calls
-- Regenerate on: profile updates, 7+ days staleness, manual refresh
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.interpretations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  
  -- Cached interpretation outputs
  current_read text NOT NULL,
  
  -- Metadata for cache invalidation
  profile_version_hash text NOT NULL,  -- MD5 hash of profile fields
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Token usage tracking
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  cost_usd numeric(10, 6) NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Foreign key
  CONSTRAINT interpretations_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_interpretations_user_id 
  ON public.interpretations(user_id);

CREATE INDEX IF NOT EXISTS idx_interpretations_generated_at 
  ON public.interpretations(generated_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.interpretations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own interpretation
CREATE POLICY "Users can view own interpretation"
  ON public.interpretations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own interpretation
CREATE POLICY "Users can insert own interpretation"
  ON public.interpretations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own interpretation
CREATE POLICY "Users can update own interpretation"
  ON public.interpretations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own interpretation
CREATE POLICY "Users can delete own interpretation"
  ON public.interpretations
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: intelligence_costs (optional cost tracking)
-- ============================================================================
-- Purpose: Track API costs per operation for monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.intelligence_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  operation text NOT NULL,  -- 'current_read', 'task_generation', etc.
  
  -- Token usage
  input_tokens integer NOT NULL,
  output_tokens integer NOT NULL,
  cost_usd numeric(10, 6) NOT NULL,
  
  -- Timestamp
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Foreign key
  CONSTRAINT intelligence_costs_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE
);

-- Index for cost analysis queries
CREATE INDEX IF NOT EXISTS idx_intelligence_costs_timestamp 
  ON public.intelligence_costs(timestamp);

CREATE INDEX IF NOT EXISTS idx_intelligence_costs_user_id 
  ON public.intelligence_costs(user_id);

-- RLS for costs table
ALTER TABLE public.intelligence_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own costs"
  ON public.intelligence_costs
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if interpretation is stale (>7 days old)
CREATE OR REPLACE FUNCTION is_interpretation_stale(generated timestamp with time zone)
RETURNS boolean AS $$
BEGIN
  RETURN (CURRENT_TIMESTAMP - generated) > INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Cache invalidation strategy:
-- 1. Profile version hash changes → stale
-- 2. Generated >7 days ago → stale
-- 3. Manual refresh requested → stale
--
-- Cost tracking:
-- - intelligence_costs table tracks per-operation costs
-- - Monthly cost analysis via SQL queries (see INTELLIGENCE_LAYER_DESIGN.md)
--
-- ============================================================================
