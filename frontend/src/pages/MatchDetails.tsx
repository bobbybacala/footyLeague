import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { matchesApi } from "@/api/client";
import { EventTimeline } from "@/components/match-card/EventTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MatchDetails() {
  const { id } = useParams<{ id: string }>();
  const matchId = Number(id);
  const navigate = useNavigate();

  const { data: match, isLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => matchesApi.get(matchId),
    enabled: !!matchId,
  });

  if (isLoading || !match) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="break-words text-base md:text-lg">
            {match.home_team_name} {match.home_score} - {match.away_score}{" "}
            {match.away_team_name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EventTimeline events={match.events} />
        </CardContent>
      </Card>
      <Button
        variant="outline"
        onClick={() => navigate(`/leagues/${match.league}`)}
      >
        Back to Dashboard
      </Button>
    </div>
  );
}
