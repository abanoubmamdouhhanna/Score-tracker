import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

const commonEmojis = ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🏸", "🏒", "🎯", "🎪", "🎨", "🚀", "⭐", "🔥", "💎"];

interface AddTeamFormProps {
  onAddTeam: (name: string, emoji?: string) => void;
}

export const AddTeamForm = ({ onAddTeam }: AddTeamFormProps) => {
  const [teamName, setTeamName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("⚽");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      onAddTeam(teamName.trim(), selectedEmoji);
      setTeamName("");
      setSelectedEmoji("⚽");
      setIsExpanded(false);
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="mb-8">
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-6">
          {isExpanded ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="h-10 w-12 p-0 text-xl"
                  >
                    {selectedEmoji}
                  </Button>
                  {showEmojiPicker && (
                    <div className="absolute top-12 left-0 z-50 bg-card border rounded-lg p-2 shadow-lg">
                      <div className="grid grid-cols-4 gap-1 w-32">
                        {commonEmojis.map((emoji) => (
                          <Button
                            key={emoji}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-lg hover:bg-accent"
                            onClick={() => {
                              setSelectedEmoji(emoji);
                              setShowEmojiPicker(false);
                            }}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Input
                  type="text"
                  placeholder="Enter team name..."
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="flex-1"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={!teamName.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsExpanded(false);
                    setTeamName("");
                    setSelectedEmoji("⚽");
                    setShowEmojiPicker(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button 
              onClick={() => setIsExpanded(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Team
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};