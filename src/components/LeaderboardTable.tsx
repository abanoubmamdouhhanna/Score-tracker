import { Team } from "./TeamCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy } from "lucide-react";

interface LeaderboardTableProps {
  teams: Team[];
}

export const LeaderboardTable = ({ teams }: LeaderboardTableProps) => {
  if (teams.length === 0) return null;

  // Sort teams by score (highest first)
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="mt-8 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Leaderboard</h2>
      </div>
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Rank</TableHead>
              <TableHead>Team</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead className="text-center">Correct</TableHead>
              <TableHead className="text-center">Wrong</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTeams.map((team, index) => (
              <TableRow 
                key={team.id}
                className={index === 0 && team.score > 0 ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800" : ""}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1">
                    {index === 0 && team.score > 0 ? (
                      <>
                        <Trophy className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-700 dark:text-yellow-400 font-bold">1</span>
                      </>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{team.emoji || "⚽"}</span>
                    <span className={index === 0 && team.score > 0 ? "font-semibold text-yellow-700 dark:text-yellow-400" : ""}>{team.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`font-bold ${index === 0 && team.score > 0 ? "text-yellow-700 dark:text-yellow-400 text-lg" : ""}`}>
                    {team.score}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    <span className="text-sm font-medium">{team.correctAnswers || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-red-600 dark:text-red-400">✗</span>
                    <span className="text-sm font-medium">{team.wrongAnswers || 0}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};