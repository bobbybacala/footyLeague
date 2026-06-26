import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { leaguesApi } from "@/api/client";
import { PointsTable } from "@/components/points-table/PointsTable";
import { MatchCard } from "@/components/match-card/MatchCard";
import { AwardsPanel } from "@/components/awards-panel/AwardsPanel";
import { FixtureCard } from "@/components/fixture-card/FixtureCard";
import { StartMatchDialog } from "@/components/match-card/StartMatchDialog";
import { MatchDetailsDialog } from "@/components/match-card/MatchDetailsDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAssignedMatchIds } from "@/lib/matchSearch";
import type { Match } from "@/types";

export default function LeagueDashboard() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [confirmMatchId, setConfirmMatchId] = useState<number | null>(null);

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

  const { data: matchdays } = useQuery({
    queryKey: ["matchdays", leagueId],
    queryFn: () => leaguesApi.matchdays(leagueId),
    enabled: !!leagueId,
  });

  const assignedMatchIds = useMemo(
    () => getAssignedMatchIds(matchdays ?? []),
    [matchdays]
  );

  const handleMatchStarted = (match: Match) => {
    queryClient.invalidateQueries({ queryKey: ["matches", leagueId] });
    setConfirmMatchId(null);
    navigate(`/matches/${match.id}`);
  };

  const confirmMatch = pendingMatches?.find((m) => m.id === confirmMatchId);

  if (leagueLoading) {
    return (
      <div className="p-4 md:p-6">
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
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:space-y-8 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary md:text-3xl">{league?.name}</h1>
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
            <div className="space-y-2">
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

        <AwardsPanel leagueId={leagueId} awards={awards} isLoading={awardsLoading} />
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
                canStart={assignedMatchIds.has(match.id)}
                onStart={setConfirmMatchId}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No upcoming fixtures. Generate fixtures from league settings.
          </p>
        )}
      </div>

      <StartMatchDialog
        match={confirmMatch ?? null}
        leagueId={leagueId}
        open={!!confirmMatchId}
        onOpenChange={(open) => !open && setConfirmMatchId(null)}
        onStarted={handleMatchStarted}
      />

      <MatchDetailsDialog
        match={selectedMatch}
        open={!!selectedMatch}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
      />
    </div>
  );
}
