-- Create reflections table for capturing user insights on completed tasks
-- This enables the learning loop: what worked and why

CREATE TABLE IF NOT EXISTS public.reflections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  linked_task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS reflections_user_id_idx ON public.reflections(user_id);
CREATE INDEX IF NOT EXISTS reflections_linked_task_id_idx ON public.reflections(linked_task_id);
CREATE INDEX IF NOT EXISTS reflections_created_at_idx ON public.reflections(created_at DESC);

-- Enable RLS
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own reflections
CREATE POLICY "Users can view own reflections" ON public.reflections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reflections" ON public.reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reflections" ON public.reflections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reflections" ON public.reflections
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.reflections TO authenticated;
GRANT ALL ON public.reflections TO service_role;
