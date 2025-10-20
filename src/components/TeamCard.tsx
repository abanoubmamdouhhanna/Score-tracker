import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, RotateCcw, Edit2, Trash2, Check, X, Undo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TeamHistory } from "./TeamHistory";

export interface Team {
  id: string;
  name: string;
  score: number;
  isLeading: boolean;
  emoji?: string;
  isPinned?: boolean;
  correctAnswers?: number;
  wrongAnswers?: number;
}

interface TeamCardProps {
  team: Team;
  onUpdateScore: (id: string, newScore: number, changeType?: 'point' | 'yellow_card' | 'red_card' | 'reset', answerType?: 'correct' | 'wrong') => void;
  onUpdateName: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  isLeading: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  teamColor: string;
  viewMode: 'grid' | 'list';
  onUndo: (teamId: string) => void;
}

export const TeamCard = ({ team, onUpdateScore, onUpdateName, onDelete, isLeading, isSelected, onSelect, teamColor, viewMode, onUndo }: TeamCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(team.name);
  const { toast } = useToast();

  const handleScoreChange = (change: number, answerType?: 'correct' | 'wrong') => {
    const newScore = team.score + change; // Allow negative scores
    onUpdateScore(team.id, newScore, 'point', answerType);
  };

  const handleReset = () => {
    onUpdateScore(team.id, 0, 'reset');
  };

  const handleSaveName = () => {
    if (editName.trim() && editName.trim() !== team.name) {
      onUpdateName(team.id, editName.trim());
      toast({
        title: "Team renamed",
        description: `Team name updated to "${editName.trim()}"`,
        duration: 2000,
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(team.name);
    setIsEditing(false);
  };

  return (
    <div 
      className={`team-card animate-scale-in cursor-pointer transition-all duration-200 ${
        isLeading ? 'leading pulse-glow' : ''
      } ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
      } ${
        viewMode === 'list' ? 'flex items-center gap-4 p-4' : ''
      }`}
      style={{ backgroundColor: teamColor }}
      onClick={() => onSelect(team.id)}
    >
      {isLeading && (
        <div className="absolute -top-2 -right-2 bg-success text-success-foreground px-3 py-1 rounded-full text-sm font-semibold animate-floating z-10">
          🏆 Leading!
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="input-modern text-lg font-semibold bg-background text-foreground border-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              autoFocus
            />
            <Button size="sm" onClick={handleSaveName} className="bg-success hover:bg-success/90">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">{team.emoji || "⚽"}</span>
            <h3 className="text-xl font-bold">{team.name}</h3>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsEditing(true)}
              className="opacity-60 hover:opacity-100"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onUndo(team.id)}
            className="opacity-60 hover:opacity-100 text-orange-600 hover:text-orange-700"
            title="Undo last action for this team"
          >
            <Undo className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onDelete(team.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className={`${viewMode === 'list' ? 'flex items-center gap-6' : 'text-center mb-6'}`}>
        <div className={viewMode === 'list' ? '' : 'mb-2'}>
          <div className="score-display">{team.score}</div>
          {viewMode === 'grid' && <p className="text-sm opacity-70">Current Score</p>}
        </div>
        
        {/* Answer Counts */}
        <div className={`flex gap-4 ${viewMode === 'list' ? '' : 'justify-center mb-4'}`}>
          <div className="flex items-center gap-1 bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-2 border border-green-200 dark:border-green-800">
            <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">{team.correctAnswers || 0}</span>
          </div>
          <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2 border border-red-200 dark:border-red-800">
            <span className="text-red-600 dark:text-red-400 font-semibold">✗</span>
            <span className="text-sm font-medium text-red-700 dark:text-red-300">{team.wrongAnswers || 0}</span>
          </div>
        </div>
      </div>

      {/* Score Control Buttons */}
      <div className={`space-y-3 ${viewMode === 'list' ? 'ml-auto' : ''}`}>
        {/* Main Big Buttons */}
        <div className={`flex gap-3 ${viewMode === 'grid' ? 'justify-center' : 'justify-end'}`}>
          {/* +1 Button (Big, Green) */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleScoreChange(1, 'correct');
            }}
            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 text-lg sm:text-xl px-6 sm:px-8 py-3 sm:py-4 h-auto flex-1 min-w-[100px] sm:min-w-[120px]"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2" />
            +1
          </Button>

          {/* -1 Button (Big, Red) */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleScoreChange(-1, 'wrong');
            }}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 text-lg sm:text-xl px-6 sm:px-8 py-3 sm:py-4 h-auto flex-1 min-w-[100px] sm:min-w-[120px]"
          >
            <Minus className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2" />
            -1
          </Button>
        </div>

        {/* Small Buttons */}
        <div className={`flex gap-1 flex-wrap ${viewMode === 'grid' ? 'justify-center' : 'justify-end'}`}>
          {/* +2 Button */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleScoreChange(2, 'correct');
            }}
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="h-3 w-3 mr-1" />
            +2
          </Button>

          {/* +3 Button */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleScoreChange(3, 'correct');
            }}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="h-3 w-3 mr-1" />
            +3
          </Button>

          {/* -2 Button */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleScoreChange(-2, 'wrong');
            }}
            size="sm"
            variant="outline"
            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-300 dark:border-red-800 dark:hover:border-red-700 transition-all duration-200"
          >
            <Minus className="h-3 w-3 mr-1" />
            -2
          </Button>

          {/* -3 Button */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleScoreChange(-3, 'wrong');
            }}
            size="sm"
            variant="outline"
            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 hover:border-red-300 dark:bg-red-950/30 dark:hover:bg-red-950/50 dark:text-red-300 dark:border-red-800 dark:hover:border-red-700 transition-all duration-200"
          >
            <Minus className="h-3 w-3 mr-1" />
            -3
          </Button>
        </div>
      </div>

      {/* Team History - Only show in grid view */}
      {viewMode === 'grid' && (
        <div className="mt-4">
          <TeamHistory teamId={team.id} teamName={team.name} />
        </div>
      )}
    </div>
  );
};