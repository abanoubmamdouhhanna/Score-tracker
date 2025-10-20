-- Add columns for correct and wrong answers tracking to teams table
ALTER TABLE public.teams 
ADD COLUMN correct_answers integer NOT NULL DEFAULT 0,
ADD COLUMN wrong_answers integer NOT NULL DEFAULT 0;

-- Create index for better performance
CREATE INDEX idx_teams_answers ON public.teams(correct_answers, wrong_answers);