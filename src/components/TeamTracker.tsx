import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TeamCard, Team } from "./TeamCard";
import { AddTeamForm } from "./AddTeamForm";
import { Confetti } from "./Confetti";
import { GlobalControlBar } from "./GlobalControlBar";
import { LeaderboardTable } from "./LeaderboardTable";
import { GameHistory } from "./GameHistory";
import { Button } from "@/components/ui/button";
import { Trophy, Users, BarChart3, Moon, Sun, LogOut, Play, Square } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface DatabaseTeam {
  id: string;
  name: string;
  score: number;
  emoji: string;
  is_pinned: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  correct_answers: number;
  wrong_answers: number;
}

export const TeamTracker = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [previousLeader, setPreviousLeader] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'card'>('grid');
  const [gameTime, setGameTime] = useState(10); // 10 seconds default for countdown
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [showEndGameDialog, setShowEndGameDialog] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Team colors for visual distinction
  const teamColors = [
    'hsl(var(--primary) / 0.1)',
    'hsl(var(--secondary) / 0.2)',
    'hsl(var(--accent) / 0.15)',
    'hsl(142, 71%, 45% / 0.1)', // Green
    'hsl(346, 87%, 55% / 0.1)', // Pink
    'hsl(262, 83%, 58% / 0.1)', // Purple
    'hsl(221, 83%, 53% / 0.1)', // Blue
    'hsl(48, 96%, 53% / 0.1)',  // Yellow
    'hsl(24, 95%, 53% / 0.1)',  // Orange
    'hsl(351, 83%, 61% / 0.1)', // Red
  ];

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Load dark mode preference
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('team-tracker-dark-mode');
    if (savedDarkMode) {
      const isDark = JSON.parse(savedDarkMode);
      setDarkMode(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, []);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('team-tracker-dark-mode', JSON.stringify(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Countdown timer effect
  useEffect(() => {
    if (gameTime > 0 && !isTimerPaused) {
      timerRef.current = setInterval(() => {
        setGameTime(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            toast({
              title: "⏰ Time's Up!",
              description: "The countdown has finished!",
              duration: 5000,
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameTime, isTimerPaused, toast]);

  // Load teams from Supabase
  useEffect(() => {
    const loadTeams = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('teams')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: true });

        if (error) throw error;

        const formattedTeams: Team[] = data.map((dbTeam: DatabaseTeam) => ({
          id: dbTeam.id,
          name: dbTeam.name,
          score: dbTeam.score,
          isLeading: false,
          emoji: dbTeam.emoji,
          isPinned: dbTeam.is_pinned,
          correctAnswers: dbTeam.correct_answers,
          wrongAnswers: dbTeam.wrong_answers,
        }));

        setTeams(formattedTeams);
      } catch (error) {
        console.error('Error loading teams:', error);
        toast({
          title: "Error",
          description: "Failed to load teams. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, [user, toast]);

  // Check for leader changes and trigger confetti
  useEffect(() => {
    if (teams.length === 0) return;

    const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
    const currentLeader = sortedTeams.length > 0 && sortedTeams[0].score > 0 ? sortedTeams[0].id : null;

    if (currentLeader && currentLeader !== previousLeader && previousLeader !== null) {
      setShowConfetti(true);
      const leaderTeam = teams.find(t => t.id === currentLeader);
      toast({
        title: "🎉 New Leader!",
        description: `${leaderTeam?.name} has taken the lead with ${leaderTeam?.score} points!`,
        duration: 4000,
      });
      
      setTimeout(() => setShowConfetti(false), 3000);
    }

    setPreviousLeader(currentLeader);
  }, [teams, previousLeader, toast]);

  const addTeam = async (name: string, emoji = "⚽") => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([
          {
            name,
            emoji,
            user_id: user.id,
            score: 0,
            is_pinned: false,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const newTeam: Team = {
        id: data.id,
        name: data.name,
        score: data.score,
        isLeading: false,
        emoji: data.emoji,
        isPinned: data.is_pinned,
        correctAnswers: data.correct_answers || 0,
        wrongAnswers: data.wrong_answers || 0,
      };

      setTeams(prev => [...prev, newTeam]);
      toast({
        title: "Team added!",
        description: `${name} has been added to the competition.`,
        duration: 2000,
      });
    } catch (error) {
      console.error('Error adding team:', error);
      toast({
        title: "Error",
        description: "Failed to add team. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateTeamScore = async (id: string, newScore: number, changeType: 'point' | 'yellow_card' | 'red_card' | 'reset' = 'point', answerType?: 'correct' | 'wrong') => {
    if (!user) return;

    const team = teams.find(t => t.id === id);
    if (!team) return;

    const previousScore = team.score;
    const changeAmount = newScore - previousScore;

    try {
      // Prepare update object
      const updateData: any = { score: newScore };
      
      // Update answer counts if specified
      if (answerType === 'correct') {
        updateData.correct_answers = (team.correctAnswers || 0) + 1;
      } else if (answerType === 'wrong') {
        updateData.wrong_answers = (team.wrongAnswers || 0) + 1;
      }

      // Save current action for undo functionality
      await supabase
        .from('last_actions')
        .insert([
          {
            user_id: user.id,
            team_id: id,
            action_type: 'score_change',
            previous_score: previousScore,
            score_change: changeAmount,
            change_type: changeType,
            answer_type: answerType,
          }
        ]);

      // Update team score and answer counts
      const { error: teamError } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', id);

      if (teamError) throw teamError;

      // Add to score history
      const { error: historyError } = await supabase
        .from('score_history')
        .insert([
          {
            team_id: id,
            change_amount: changeAmount,
            change_type: changeType,
            previous_score: previousScore,
            new_score: newScore,
          }
        ]);

      if (historyError) throw historyError;

      setTeams(prev => prev.map(team => 
        team.id === id ? { 
          ...team, 
          score: newScore,
          correctAnswers: answerType === 'correct' ? (team.correctAnswers || 0) + 1 : team.correctAnswers,
          wrongAnswers: answerType === 'wrong' ? (team.wrongAnswers || 0) + 1 : team.wrongAnswers,
        } : team
      ));

      if (changeAmount > 0) {
        toast({
          title: "Score updated!",
          description: `${team.name} scored ${changeAmount} point${changeAmount > 1 ? 's' : ''}!`,
          duration: 2000,
        });
      } else if (changeAmount < 0) {
        toast({
          title: "Score deducted",
          description: `${team.name} lost ${Math.abs(changeAmount)} point${Math.abs(changeAmount) > 1 ? 's' : ''}`,
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error updating score:', error);
      toast({
        title: "Error",
        description: "Failed to update score. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleScoreChange = (teamId: string, change: number, answerType?: 'correct' | 'wrong') => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    
    const newScore = team.score + change; // Allow negative scores
    updateTeamScore(teamId, newScore, 'point', answerType);
  };

  const handleTeamUndo = async (teamId: string) => {
    if (!user) return;

    try {
      // Get the most recent action for this specific team
      const { data: lastAction, error: fetchError } = await supabase
        .from('last_actions')
        .select('*')
        .eq('user_id', user.id)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!lastAction) {
        toast({
          title: "Nothing to undo",
          description: "No recent actions found for this team",
          duration: 2000,
        });
        return;
      }

      // Restore the previous score
      const { error: updateError } = await supabase
        .from('teams')
        .update({ score: lastAction.previous_score })
        .eq('id', lastAction.team_id);

      if (updateError) throw updateError;

      // Delete the last action record
      const { error: deleteError } = await supabase
        .from('last_actions')
        .delete()
        .eq('id', lastAction.id);

      if (deleteError) throw deleteError;

      // Update local state
      setTeams(prev => prev.map(team => 
        team.id === lastAction.team_id ? { 
          ...team, 
          score: lastAction.previous_score,
        } : team
      ));

      const team = teams.find(t => t.id === lastAction.team_id);
      toast({
        title: "Action undone",
        description: `${team?.name}'s score restored to ${lastAction.previous_score}`,
        duration: 2000,
      });

    } catch (error) {
      console.error('Error undoing action:', error);
      toast({
        title: "Error",
        description: "Failed to undo action. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUndo = async () => {
    if (!user) return;

    try {
      // Get the most recent action for this user
      const { data: lastAction, error: fetchError } = await supabase
        .from('last_actions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!lastAction) {
        toast({
          title: "Nothing to undo",
          description: "No recent actions found",
          duration: 2000,
        });
        return;
      }

      // Restore the previous score
      const { error: updateError } = await supabase
        .from('teams')
        .update({ score: lastAction.previous_score })
        .eq('id', lastAction.team_id);

      if (updateError) throw updateError;

      // Delete the last action record
      const { error: deleteError } = await supabase
        .from('last_actions')
        .delete()
        .eq('id', lastAction.id);

      if (deleteError) throw deleteError;

      // Update local state
      setTeams(prev => prev.map(team => 
        team.id === lastAction.team_id ? { 
          ...team, 
          score: lastAction.previous_score,
        } : team
      ));

      const team = teams.find(t => t.id === lastAction.team_id);
      toast({
        title: "Action undone",
        description: `${team?.name}'s score restored to ${lastAction.previous_score}`,
        duration: 2000,
      });

    } catch (error) {
      console.error('Error undoing action:', error);
      toast({
        title: "Error",
        description: "Failed to undo action. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateTeamName = async (id: string, newName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: newName })
        .eq('id', id);

      if (error) throw error;

      setTeams(prev => prev.map(team => 
        team.id === id ? { ...team, name: newName } : team
      ));

      toast({
        title: "Team renamed",
        description: `Team name updated to "${newName}"`,
        duration: 2000,
      });
    } catch (error) {
      console.error('Error updating team name:', error);
      toast({
        title: "Error",
        description: "Failed to update team name. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteTeam = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTeams(prev => prev.filter(team => team.id !== id));
      toast({
        title: "Team removed",
        description: "Team has been deleted from the competition",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error",
        description: "Failed to delete team. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCardPenalty = async (teamId: string, cardType: 'yellow' | 'red') => {
    if (!user) return;

    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    // Determine points to deduct
    const pointsDeducted = cardType === 'yellow' ? 1 : 2;
    const newScore = team.score - pointsDeducted;

    try {
      // Save current action for undo functionality
      await supabase
        .from('last_actions')
        .insert([
          {
            user_id: user.id,
            team_id: teamId,
            action_type: 'score_change',
            previous_score: team.score,
            score_change: -pointsDeducted,
            change_type: cardType === 'yellow' ? 'yellow_card' : 'red_card',
          }
        ]);

      // Update team score
      const { error: teamError } = await supabase
        .from('teams')
        .update({ score: newScore })
        .eq('id', teamId);

      if (teamError) throw teamError;

      // Add to card_penalties table
      const { error: cardError } = await supabase
        .from('card_penalties')
        .insert([
          {
            team_id: teamId,
            card_type: cardType,
            points_deducted: pointsDeducted,
          }
        ]);

      if (cardError) throw cardError;

      // Add to score_history
      const { error: historyError } = await supabase
        .from('score_history')
        .insert([
          {
            team_id: teamId,
            change_amount: -pointsDeducted,
            change_type: cardType === 'yellow' ? 'yellow_card' : 'red_card',
            previous_score: team.score,
            new_score: newScore,
          }
        ]);

      if (historyError) throw historyError;

      // Update local state
      setTeams(prev => prev.map(t => 
        t.id === teamId ? { ...t, score: newScore } : t
      ));

      toast({
        title: cardType === 'yellow' ? "🟨 Yellow Card!" : "🟥 Red Card!",
        description: `${team.name} received a ${cardType} card (-${pointsDeducted} point${pointsDeducted > 1 ? 's' : ''})`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error adding card penalty:', error);
      toast({
        title: "Error",
        description: "Failed to add card penalty. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTeamSelect = (teamId: string) => {
    // Only one team can be selected at a time
    setSelectedTeamId(prev => prev === teamId ? null : teamId);
  };

  const handleClearSelection = () => {
    setSelectedTeamId(null);
  };

  const handleResetTimer = () => {
    setGameTime(0); // Reset to 0 seconds
    toast({
      title: "Timer Reset",
      description: "Countdown timer has been reset to 0:00",
      duration: 2000,
    });
  };

  const handleSetCustomTime = (minutes: number, seconds: number) => {
    const totalSeconds = (minutes * 60) + seconds;
    setGameTime(totalSeconds);
    toast({
      title: "Timer Set",
      description: `Timer set to ${minutes}:${seconds.toString().padStart(2, '0')}`,
      duration: 2000,
    });
  };

  const handleStartGame = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .insert([
          {
            user_id: user.id,
            is_active: true,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setCurrentGameId(data.id);
      setGameStartTime(Date.now());
      toast({
        title: "🎮 Game Started!",
        description: "Good luck to all teams!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: "Error",
        description: "Failed to start game. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEndGame = async (saveHistory: boolean = true) => {
    if (!user || !currentGameId) return;

    try {
      const endTime = Date.now();
      const duration = gameStartTime ? Math.floor((endTime - gameStartTime) / 1000) : 0;

      if (saveHistory) {
        // Update game session
        const { error: sessionError } = await supabase
          .from('game_sessions')
          .update({
            ended_at: new Date().toISOString(),
            total_duration: duration,
            is_active: false,
          })
          .eq('id', currentGameId);

        if (sessionError) throw sessionError;

        // Calculate rankings
        const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
        
        // Save team results with rankings
        const teamResults = sortedTeams.map((team, index) => ({
          game_session_id: currentGameId,
          team_id: team.id,
          team_name: team.name,
          final_score: team.score,
          correct_answers: team.correctAnswers || 0,
          wrong_answers: team.wrongAnswers || 0,
          rank: index + 1,
        }));

        const { error: resultsError } = await supabase
          .from('game_team_results')
          .insert(teamResults);

        if (resultsError) throw resultsError;

        const winner = sortedTeams[0];
        toast({
          title: "🏆 Game Ended & Saved!",
          description: `Winner: ${winner.name} with ${winner.score} points!`,
          duration: 5000,
        });

        // Trigger confetti for winner
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        // Just delete the game session without saving results
        await supabase
          .from('game_sessions')
          .delete()
          .eq('id', currentGameId);

        toast({
          title: "Game Ended",
          description: "Game ended without saving to history.",
          duration: 3000,
        });
      }

      setCurrentGameId(null);
      setGameStartTime(null);
    } catch (error) {
      console.error('Error ending game:', error);
      toast({
        title: "Error",
        description: "Failed to end game. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading your teams...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Keep original team order but identify leader
  const teamsToDisplay = [...teams].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0; // Keep original creation order for non-pinned teams
  });
  
  const leadingScore = teams.length > 0 ? Math.max(...teams.map(t => t.score)) : 0;
  const totalPoints = teams.reduce((sum, team) => sum + team.score, 0);

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <Confetti isActive={showConfetti} />
      
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative mb-6">
            {/* Sign Out Button - Positioned absolutely in top right */}
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="absolute top-0 right-0 p-2"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            
            {/* Centered Brand Title Container */}
            <div className="flex flex-col items-center text-center animate-fade-in">
              <div className="flex items-center gap-3 mb-2 animate-scale-in">
                <div className="relative">
                  <Trophy className="h-8 w-8 md:h-10 md:w-10 text-primary animate-floating" />
                  <div className="absolute -inset-1 bg-primary/20 rounded-full blur-md animate-pulse-glow"></div>
                </div>
                <div className="flex flex-col items-center">
                  {/* Main Brand Name */}
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-black gradient-text tracking-tight leading-none">
                    Abanoub
                  </h1>
                  {/* Subtitle */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 md:w-12 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                    <span className="text-sm md:text-base font-medium text-muted-foreground tracking-wider uppercase">
                      Score Tracker
                    </span>
                    <div className="w-8 md:w-12 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                  </div>
                </div>
                <div className="relative">
                  <Trophy className="h-8 w-8 md:h-10 md:w-10 text-primary animate-floating" style={{ animationDelay: '1s' }} />
                  <div className="absolute -inset-1 bg-primary/20 rounded-full blur-md animate-pulse-glow"></div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xl text-muted-foreground mb-6">
            Track scores, celebrate victories, and keep the competition alive!
          </p>
          
          {/* Stats Bar */}
          <div className="flex justify-center gap-6 mb-6 flex-wrap">
            <div className="flex items-center gap-2 bg-card rounded-lg px-4 py-2 shadow-sm">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-semibold">{teams.length} Teams</span>
            </div>
            <div className="flex items-center gap-2 bg-card rounded-lg px-4 py-2 shadow-sm">
              <BarChart3 className="h-5 w-5 text-accent" />
              <span className="font-semibold">{totalPoints} Total Points</span>
            </div>
            <Button
              onClick={() => setDarkMode(!darkMode)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {darkMode ? 'Light' : 'Dark'} Mode
            </Button>
          </div>
        </div>

        <AddTeamForm onAddTeam={addTeam} />

        {/* Game Control Buttons */}
        {teams.length > 0 && (
          <div className="mb-6 flex justify-center gap-4">
            {!currentGameId ? (
              <Button
                onClick={handleStartGame}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 md:px-8"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Game
              </Button>
            ) : (
              <Button
                onClick={() => setShowEndGameDialog(true)}
                size="lg"
                variant="destructive"
                className="shadow-lg hover:shadow-xl transition-all duration-200 px-6 md:px-8"
              >
                <Square className="h-5 w-5 mr-2" />
                End Game
              </Button>
            )}
          </div>
        )}

        {teams.length > 0 && (
          <GlobalControlBar
            selectedTeamId={selectedTeamId}
            onCardPenalty={handleCardPenalty}
            onClearSelection={handleClearSelection}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            gameTime={gameTime}
            isTimerPaused={isTimerPaused}
            onTogglePause={() => setIsTimerPaused(!isTimerPaused)}
            onResetTimer={handleResetTimer}
            onSetCustomTime={handleSetCustomTime}
            onUndo={handleUndo}
          />
        )}

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold mb-2">Ready to compete?</h3>
              <p className="text-muted-foreground">
                Add your first team to start tracking scores and see who comes out on top!
              </p>
            </div>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : viewMode === 'card'
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {teamsToDisplay.map((team, index) => (
              <TeamCard
                key={team.id}
                team={team}
                onUpdateScore={updateTeamScore}
                onUpdateName={updateTeamName}
                onDelete={deleteTeam}
                isLeading={team.score === leadingScore && team.score > 0}
                isSelected={selectedTeamId === team.id}
                onSelect={handleTeamSelect}
                teamColor={teamColors[index % teamColors.length]}
                viewMode={viewMode}
                onUndo={handleTeamUndo}
              />
            ))}
          </div>
        )}

        {/* Leaderboard Table */}
        <LeaderboardTable teams={teams} />

        {/* Spacing */}
        <div className="h-12"></div>

        {/* Game History */}
        {user && <GameHistory userId={user.id} />}
      </div>

      {/* End Game Dialog */}
      <AlertDialog open={showEndGameDialog} onOpenChange={setShowEndGameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Game</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to save this game to your history?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowEndGameDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                setShowEndGameDialog(false);
                handleEndGame(false);
              }}
            >
              End Without Saving
            </Button>
            <AlertDialogAction
              onClick={() => {
                setShowEndGameDialog(false);
                handleEndGame(true);
              }}
            >
              Save & End Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};