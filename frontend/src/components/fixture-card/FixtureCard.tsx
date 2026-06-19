import type { Match } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FixtureCardProps {
  match: Match;
  onStart: (matchId: number) => void;
  isStarting?: boolean;
}

export function FixtureCard({ match, onStart, isStarting }: FixtureCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="text-center">
          <p className="text-lg font-semibold">
            {match.home_team_name} vs {match.away_team_name}
          </p>
          <Badge variant="outline" className="mt-2">
            {match.status}
          </Badge>
        </div>
        <Button
          className="w-full"
          onClick={() => onStart(match.id)}
          disabled={isStarting || match.status !== "PENDING"}
        >
          Start Match
        </Button>
      </CardContent>
    </Card>
  );
}
