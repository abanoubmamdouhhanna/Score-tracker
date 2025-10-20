-- Create game_sessions table to track individual games
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER, -- in seconds
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_sessions
CREATE POLICY "Users can view their own game sessions"
  ON public.game_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own game sessions"
  ON public.game_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game sessions"
  ON public.game_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own game sessions"
  ON public.game_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create game_team_results table to store final team scores for each game
CREATE TABLE public.game_team_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  final_score INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  wrong_answers INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_session_id, team_id)
);

-- Enable RLS
ALTER TABLE public.game_team_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_team_results
CREATE POLICY "Users can view results from their game sessions"
  ON public.game_team_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.game_sessions
      WHERE game_sessions.id = game_team_results.game_session_id
      AND game_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create results for their game sessions"
  ON public.game_team_results
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.game_sessions
      WHERE game_sessions.id = game_team_results.game_session_id
      AND game_sessions.user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_game_sessions_user_active ON public.game_sessions(user_id, is_active);
CREATE INDEX idx_game_team_results_game_session ON public.game_team_results(game_session_id);