-- Migration: Create tasks table for tracking task completion/skip
-- Date: 2026-01-02
-- Purpose: Record task interactions for learning and history

-- ============================================================================
-- TABLE: tasks
-- ============================================================================
-- Purpose: Track task status (done/skipped) for pattern learning
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  
  -- Task content (snapshot from when task was generated)
  title text NOT NULL,
  reasoning text,
  guardrail text,
  
  -- Status tracking
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'skipped')),
  
  -- Optional reflection when completing
  reflection text,
  
  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  
  -- Foreign key
  CONSTRAINT tasks_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_user_id 
  ON public.tasks(user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status 
  ON public.tasks(status);

CREATE INDEX IF NOT EXISTS idx_tasks_created_at 
  ON public.tasks(created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tasks
CREATE POLICY "Users can view own tasks"
  ON public.tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tasks
CREATE POLICY "Users can insert own tasks"
  ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tasks
CREATE POLICY "Users can update own tasks"
  ON public.tasks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON public.tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Task lifecycle:
-- 1. Intelligence generates priorityTask (stored in interpretations)
-- 2. User sees task in TODAY card
-- 3. User clicks DONE or SKIP
-- 4. Task is recorded here with status
-- 5. Intelligence cache is cleared, new task generated on next load
--
-- Future use:
-- - Pattern learning (which tasks get done vs skipped)
-- - Reflection capture for completed tasks
-- - Task history for the artist
--
-- ============================================================================
