import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, ChevronDown, ChevronUp, Plus, Minus, RotateCcw, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScoreHistoryEntry {
  id: string;
  previous_score: number;
  new_score: number;
  change_type: string;
  change_amount: number;
  created_at: string;
}

interface TeamHistoryProps {
  teamId: string;
  teamName: string;
}

export const TeamHistory = ({ teamId, teamName }: TeamHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchHistory = async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('score_history')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Failed to load team history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isOpen, teamId]);

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'point':
        return <Plus className="h-3 w-3 text-green-600" />;
      case 'yellow_card':
        return <Square className="h-3 w-3 text-yellow-600 fill-current" />;
      case 'red_card':
        return <Square className="h-3 w-3 text-red-600 fill-current" />;
      case 'reset':
        return <RotateCcw className="h-3 w-3 text-orange-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-600" />;
    }
  };

  const getChangeText = (entry: ScoreHistoryEntry) => {
    switch (entry.change_type) {
      case 'point':
        return entry.change_amount > 0 ? `+${entry.change_amount} point` : `${entry.change_amount} point`;
      case 'yellow_card':
        return 'Yellow card (-1)';
      case 'red_card':
        return 'Red card (-2)';
      case 'reset':
        return 'Score reset';
      default:
        return `${entry.change_amount > 0 ? '+' : ''}${entry.change_amount}`;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between text-sm bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border-blue-200 hover:border-blue-300 dark:from-blue-950/30 dark:to-indigo-950/30 dark:hover:from-blue-950/50 dark:hover:to-indigo-950/50 dark:text-blue-300 dark:border-blue-800 dark:hover:border-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4" />
          View History
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {isOpen && (
        <Card className="mt-2 border border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {teamName} Score History
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-48">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="text-sm text-muted-foreground">Loading...</div>
                </div>
              ) : history.length === 0 ? (
                <div className="flex items-center justify-center py-4">
                  <div className="text-sm text-muted-foreground">No history yet</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {getChangeIcon(entry.change_type)}
                        <span className="text-sm font-medium">
                          {getChangeText(entry)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{entry.previous_score} → {entry.new_score}</span>
                        <span>•</span>
                        <span>{formatTime(entry.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};