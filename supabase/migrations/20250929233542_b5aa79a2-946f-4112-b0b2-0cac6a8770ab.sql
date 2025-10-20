-- Fix RLS policies for card_penalties table
-- The issue is that we need to ensure the policies work correctly with the teams relationship

-- First, let's recreate the RLS policies for card_penalties to fix the issue
DROP POLICY IF EXISTS "Users can create card penalties for their teams" ON public.card_penalties;
DROP POLICY IF EXISTS "Users can view card penalties for their teams" ON public.card_penalties;

-- Recreate policies with proper references
CREATE POLICY "Users can create card penalties for their teams" 
ON public.card_penalties 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE teams.id = card_penalties.team_id 
    AND teams.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view card penalties for their teams" 
ON public.card_penalties 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.teams 
    WHERE teams.id = card_penalties.team_id 
    AND teams.user_id = auth.uid()
  )
);

-- Add an undo capability by tracking the last action for each user
CREATE TABLE IF NOT EXISTS public.last_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  team_id uuid NOT NULL,
  action_type text NOT NULL, -- 'score_change', 'card_penalty'
  previous_score integer,
  score_change integer,
  change_type text, -- 'point', 'yellow_card', 'red_card', 'reset'
  answer_type text, -- 'correct', 'wrong', null
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on last_actions
ALTER TABLE public.last_actions ENABLE ROW LEVEL SECURITY;

-- Create policies for last_actions
CREATE POLICY "Users can manage their own last actions" 
ON public.last_actions 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_last_actions_user_created ON public.last_actions(user_id, created_at DESC);