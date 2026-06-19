import type { Match } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
}

export function MatchCard({ match, onClick }: MatchCardProps) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{match.home_team_name}</span>
            <span className="text-lg font-bold text-primary">
              {match.home_score}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{match.away_team_name}</span>
            <span className="text-lg font-bold text-primary">
              {match.away_score}
            </span>
          </div>
        </div>
        <Badge variant="secondary" className="ml-4 shrink-0">
          {match.status}
        </Badge>
      </CardContent>
    </Card>
  );
}
