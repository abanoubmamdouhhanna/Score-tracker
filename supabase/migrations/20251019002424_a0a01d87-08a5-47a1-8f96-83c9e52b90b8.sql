-- Make team_id nullable in game_team_results to preserve history when teams are deleted
ALTER TABLE game_team_results 
ALTER COLUMN team_id DROP NOT NULL;

-- Drop existing foreign key constraint
ALTER TABLE game_team_results 
DROP CONSTRAINT IF EXISTS game_team_results_team_id_fkey;

-- Add new foreign key with ON DELETE SET NULL
ALTER TABLE game_team_results 
ADD CONSTRAINT game_team_results_team_id_fkey 
FOREIGN KEY (team_id) 
REFERENCES teams(id) 
ON DELETE SET NULL;