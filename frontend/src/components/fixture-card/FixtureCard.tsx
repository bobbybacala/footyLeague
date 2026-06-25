import type { Match } from "@/types";
import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FixtureCardProps {
  match: Match;
  onStart?: (matchId: number) => void;
  onContinue?: (matchId: number) => void;
  isStarting?: boolean;
  showStart?: boolean;
}

export function FixtureCard({
  match,
  onStart,
  onContinue,
  isStarting,
  showStart = true,
}: FixtureCardProps) {
  return (
    <Card className="border-border/60 transition-colors hover:border-primary/30">
      <CardContent className="flex flex-col gap-3 p-4 md:gap-4 md:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 text-center">
            <p className="text-base font-semibold md:text-lg">
              {match.home_team_name}
            </p>
            <p className="my-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              vs
            </p>
            <p className="text-base font-semibold md:text-lg">
              {match.away_team_name}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {match.status}
          </Badge>
        </div>
        {match.scheduled_date && (
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(match.scheduled_date).toLocaleDateString()}
          </div>
        )}
        {match.status === "LIVE" && onContinue && (
          <Button className="w-full" onClick={() => onContinue(match.id)}>
            Continue Match
          </Button>
        )}
        {showStart && onStart && match.status === "PENDING" && (
          <Button
            className="w-full"
            onClick={() => onStart(match.id)}
            disabled={isStarting}
          >
            Start Match
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
