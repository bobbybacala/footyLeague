import type { Match } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchCard } from "@/components/match-card/MatchCard";

interface FixtureCardProps {
  match: Match;
  onStart?: (matchId: number) => void;
  onContinue?: (matchId: number) => void;
  isStarting?: boolean;
  showStart?: boolean;
  canStart?: boolean;
}

export function FixtureCard({
  match,
  onStart,
  onContinue,
  isStarting,
  showStart = true,
  canStart = false,
}: FixtureCardProps) {
  return (
    <Card className="border-border/60 transition-colors hover:border-primary/30">
      <CardContent className="flex flex-col gap-3 p-3 md:p-4">
        <MatchCard
          match={match}
          className="border-0 bg-transparent px-0 py-0 hover:border-transparent hover:bg-transparent"
        />
        {match.status === "LIVE" && onContinue && (
          <Button className="w-full" onClick={() => onContinue(match.id)}>
            Continue Match
          </Button>
        )}
        {showStart && onStart && match.status === "PENDING" && (
          <Button
            className="w-full"
            variant={canStart ? "default" : "secondary"}
            onClick={() => onStart(match.id)}
            disabled={isStarting || !canStart}
            title={
              !canStart
                ? "Select a matchday to start this match"
                : undefined
            }
          >
            Start Match
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
