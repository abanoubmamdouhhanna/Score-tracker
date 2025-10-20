import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Grid3X3, 
  List, 
  Plus, 
  Minus,
  Undo,
  X,
  Clock
} from "lucide-react";

interface GlobalControlBarProps {
  selectedTeamId: string | null;
  onCardPenalty: (teamId: string, cardType: 'yellow' | 'red') => void;
  onClearSelection: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  gameTime: number;
  isTimerPaused: boolean;
  onTogglePause: () => void;
  onResetTimer: () => void;
  onSetCustomTime: (minutes: number, seconds: number) => void;
  onUndo: () => void;
}

export const GlobalControlBar = ({ 
  selectedTeamId, 
  onCardPenalty, 
  onClearSelection,
  viewMode,
  onViewModeChange,
  gameTime,
  isTimerPaused,
  onTogglePause,
  onResetTimer,
  onSetCustomTime,
  onUndo
}: GlobalControlBarProps) => {
  const [customMinutes, setCustomMinutes] = useState(5);
  const [customSeconds, setCustomSeconds] = useState(0);
  const [showTimeInput, setShowTimeInput] = useState(false);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetTime = () => {
    onSetCustomTime(customMinutes, customSeconds);
    setShowTimeInput(false);
  };


  return (
    <Card className="mb-8 animate-scale-in">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6">
          
          {/* Timer and View Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Countdown Timer Section */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className={`text-3xl font-mono font-bold ${gameTime <= 60 ? 'text-red-600 animate-pulse' : 'text-primary'}`}>
                  {formatTime(gameTime)}
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button
                    onClick={onTogglePause}
                    variant={isTimerPaused ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                  >
                    {isTimerPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {isTimerPaused ? "Resume" : "Pause"}
                  </Button>
                  <Button
                    onClick={() => setShowTimeInput(!showTimeInput)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    <span className="hidden sm:inline">Set Time</span>
                  </Button>
                  <Button
                    onClick={onResetTimer}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                </div>
              </div>

              {/* Custom Time Input */}
              {showTimeInput && (
                <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium whitespace-nowrap">Minutes:</label>
                    <Input
                      type="number"
                      min="0"
                      max="99"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
                      className="w-20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium whitespace-nowrap">Seconds:</label>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={customSeconds}
                      onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-20"
                    />
                  </div>
                  <Button
                    onClick={handleSetTime}
                    size="sm"
                    className="bg-primary"
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <Button
                onClick={() => onViewModeChange('grid')}
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <Grid3X3 className="h-4 w-4" />
                <span className="hidden sm:inline">Grid</span>
              </Button>
              <Button
                onClick={() => onViewModeChange('list')}
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="gap-2"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </Button>
            </div>
          </div>

          {/* Card Penalties Section - Only shown when a team is selected */}
          {selectedTeamId && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">Card Penalties</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    1 team selected
                  </span>
                  <Button onClick={onClearSelection} variant="outline" size="sm">
                    <X className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => onCardPenalty(selectedTeamId, 'yellow')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-md shadow-lg border-2 border-yellow-600 transform hover:scale-105 transition-all duration-200 text-base sm:text-lg w-full sm:w-auto"
                >
                  🟨 Yellow Card
                </Button>
                <Button
                  onClick={() => onCardPenalty(selectedTeamId, 'red')}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-md shadow-lg border-2 border-red-700 transform hover:scale-105 transition-all duration-200 text-base sm:text-lg w-full sm:w-auto"
                >
                  🟥 Red Card
                </Button>
              </div>
            </div>
          )}

          {/* Global Undo Button - Show when no team is selected */}
          {!selectedTeamId && (
            <div className="flex justify-center">
              <Button onClick={onUndo} variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                <Undo className="h-4 w-4" />
                Undo Last Action
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};