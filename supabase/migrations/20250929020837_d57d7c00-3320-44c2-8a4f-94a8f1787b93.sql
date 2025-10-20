-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  emoji TEXT DEFAULT '⚽',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create score history table
CREATE TABLE public.score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('point', 'yellow_card', 'red_card', 'reset')),
  previous_score INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create card penalties table
CREATE TABLE public.card_penalties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL CHECK (card_type IN ('yellow', 'red')),
  points_deducted INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_penalties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for teams
CREATE POLICY "Users can view their own teams" 
ON public.teams 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own teams" 
ON public.teams 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own teams" 
ON public.teams 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own teams" 
ON public.teams 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for score history
CREATE POLICY "Users can view score history for their teams" 
ON public.score_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.teams 
  WHERE teams.id = score_history.team_id 
  AND teams.user_id = auth.uid()
));

CREATE POLICY "Users can create score history for their teams" 
ON public.score_history 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.teams 
  WHERE teams.id = score_history.team_id 
  AND teams.user_id = auth.uid()
));

-- Create RLS policies for card penalties
CREATE POLICY "Users can view card penalties for their teams" 
ON public.card_penalties 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.teams 
  WHERE teams.id = card_penalties.team_id 
  AND teams.user_id = auth.uid()
));

CREATE POLICY "Users can create card penalties for their teams" 
ON public.card_penalties 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.teams 
  WHERE teams.id = card_penalties.team_id 
  AND teams.user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();