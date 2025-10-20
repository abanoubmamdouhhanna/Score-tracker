import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Calendar, Clock, Award, Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import html2canvas from "html2canvas";

interface GameSession {
  id: string;
  started_at: string;
  ended_at: string;
  total_duration: number;
}

interface TeamResult {
  team_name: string;
  final_score: number;
  correct_answers: number;
  wrong_answers: number;
  rank: number;
}

interface GameWithResults extends GameSession {
  results: TeamResult[];
}

export const GameHistory = ({ userId }: { userId: string }) => {
  const [games, setGames] = useState<GameWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const historyRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadGameHistory();
  }, [userId]);

  const loadGameHistory = async () => {
    try {
      // Fetch completed game sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', false)
        .order('ended_at', { ascending: false })
        .limit(10);

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        setGames([]);
        setLoading(false);
        return;
      }

      // Fetch results for all sessions
      const { data: results, error: resultsError } = await supabase
        .from('game_team_results')
        .select('*')
        .in('game_session_id', sessions.map(s => s.id))
        .order('rank', { ascending: true });

      if (resultsError) throw resultsError;

      // Combine sessions with their results
      const gamesWithResults: GameWithResults[] = sessions.map(session => ({
        ...session,
        results: results?.filter(r => r.game_session_id === session.id) || []
      }));

      setGames(gamesWithResults);
    } catch (error) {
      console.error('Error loading game history:', error);
      toast({
        title: "Error",
        description: "Failed to load game history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from('game_sessions')
        .delete()
        .eq('id', gameId);

      if (error) throw error;

      // Update local state
      setGames(prev => prev.filter(game => game.id !== gameId));

      toast({
        title: "Game Deleted",
        description: "The game has been removed from history",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error deleting game:', error);
      toast({
        title: "Error",
        description: "Failed to delete game",
        variant: "destructive",
      });
    }
  };

  const handleSaveAsImage = async () => {
    if (!historyRef.current) return;

    try {
      toast({
        title: "Generating image...",
        description: "Please wait while we create your image",
      });

      // Get current background color
      const isDark = document.documentElement.classList.contains('dark');
      const bgColor = isDark ? '#1a1a1a' : '#ffffff';

      const canvas = await html2canvas(historyRef.current, {
        backgroundColor: bgColor,
        scale: 2,
      });

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) return;

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `game-history-${format(new Date(), 'yyyy-MM-dd')}.png`;
        link.href = url;
        link.click();

        // Cleanup
        URL.revokeObjectURL(url);

        toast({
          title: "Image saved!",
          description: "Your game history has been downloaded",
          duration: 2000,
        });
      });
    } catch (error) {
      console.error('Error saving image:', error);
      toast({
        title: "Error",
        description: "Failed to save image",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Game History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading game history...</p>
        </CardContent>
      </Card>
    );
  }

  if (games.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Game History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No completed games yet. Start a game to see history!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in" ref={historyRef}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Game History
          </CardTitle>
          <Button
            onClick={handleSaveAsImage}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Save as Image
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {games.map((game) => (
          <div
            key={game.id}
            className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
          >
            {/* Game Info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(game.ended_at), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(game.total_duration)}
                </div>
              </div>
              <Button
                onClick={() => handleDeleteGame(game.id)}
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Leaderboard */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Final Standings
              </h4>
              <div className="space-y-2">
                {game.results.map((result) => (
                  <div
                    key={`${game.id}-${result.team_name}`}
                    className={`flex items-center justify-between p-2 rounded ${
                      result.rank === 1
                        ? 'bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700'
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        result.rank === 1
                          ? 'bg-yellow-500 text-white'
                          : result.rank === 2
                          ? 'bg-gray-400 text-white'
                          : result.rank === 3
                          ? 'bg-orange-600 text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {result.rank}
                      </div>
                      <div>
                        <p className="font-semibold">{result.team_name}</p>
                        <p className="text-xs text-muted-foreground">
                          ✓ {result.correct_answers} | ✗ {result.wrong_answers}
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {result.final_score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};