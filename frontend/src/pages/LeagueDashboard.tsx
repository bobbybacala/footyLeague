import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leaguesApi, matchesApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { PointsTable } from "@/components/points-table/PointsTable";
import { MatchCard } from "@/components/match-card/MatchCard";
import { AwardsPanel } from "@/components/awards-panel/AwardsPanel";
import { FixtureCard } from "@/components/fixture-card/FixtureCard";
import { EventTimeline } from "@/components/match-card/EventTimeline";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Match } from "@/types";

export default function LeagueDashboard() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const { data: league, isLoading: leagueLoading } = useQuery({
    queryKey: ["league", leagueId],
    queryFn: () => leaguesApi.get(leagueId),
    enabled: !!leagueId,
  });

  const { data: standings, isLoading: standingsLoading } = useQuery({
    queryKey: ["standings", leagueId],
    queryFn: () => leaguesApi.standings(leagueId),
    enabled: !!leagueId,
  });

  const { data: awards, isLoading: awardsLoading } = useQuery({
    queryKey: ["awards", leagueId],
    queryFn: () => leaguesApi.awards(leagueId),
    enabled: !!leagueId,
  });

  const { data: finishedMatches, isLoading: finishedLoading } = useQuery({
    queryKey: ["matches", leagueId, "FINISHED"],
    queryFn: () => leaguesApi.matches(leagueId, "FINISHED"),
    enabled: !!leagueId,
  });

  const { data: pendingMatches, isLoading: pendingLoading } = useQuery({
    queryKey: ["matches", leagueId, "PENDING"],
    queryFn: () => leaguesApi.matches(leagueId, "PENDING"),
    enabled: !!leagueId,
  });

  const startMutation = useMutation({
    mutationFn: (matchId: number) => matchesApi.start(matchId),
    onSuccess: (match) => {
      queryClient.invalidateQueries({ queryKey: ["matches", leagueId] });
      toast("Match started!", "success");
      navigate(`/matches/${match.id}`);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  if (leagueLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{league?.name}</h1>
          <p className="text-muted-foreground">{league?.venue}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          Home
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <PointsTable standings={standings ?? []} isLoading={standingsLoading} />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Match Results</h2>
          {finishedLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : finishedMatches && finishedMatches.length > 0 ? (
            <div className="space-y-3">
              {finishedMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onClick={() => setSelectedMatch(match)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No completed matches yet.
            </p>
          )}
        </div>

        <AwardsPanel awards={awards} isLoading={awardsLoading} />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Upcoming Fixtures</h2>
        {pendingLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : pendingMatches && pendingMatches.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingMatches.map((match) => (
              <FixtureCard
                key={match.id}
                match={match}
                onStart={(matchId) => startMutation.mutate(matchId)}
                isStarting={startMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No upcoming fixtures. Generate fixtures from league settings.
          </p>
        )}
      </div>

      <Dialog
        open={!!selectedMatch}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedMatch?.home_team_name} {selectedMatch?.home_score} -{" "}
              {selectedMatch?.away_score} {selectedMatch?.away_team_name}
            </DialogTitle>
          </DialogHeader>
          {selectedMatch && <EventTimeline events={selectedMatch.events} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
