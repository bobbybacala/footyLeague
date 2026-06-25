import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { leaguesApi } from "@/api/client";
import { FixtureCard } from "@/components/fixture-card/FixtureCard";
import { StartMatchDialog } from "@/components/match-card/StartMatchDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function UpcomingFixturesPage() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmMatchId, setConfirmMatchId] = useState<number | null>(null);

  const { data: pendingMatches, isLoading } = useQuery({
    queryKey: ["matches", leagueId, "PENDING"],
    queryFn: () => leaguesApi.matches(leagueId, "PENDING"),
  });

  const handleMatchStarted = (match: { id: number }) => {
    queryClient.invalidateQueries({ queryKey: ["matches", leagueId] });
    setConfirmMatchId(null);
    navigate(`/matches/${match.id}`);
  };

  const confirmMatch = pendingMatches?.find((m) => m.id === confirmMatchId);

  return (
    <div className="mx-auto max-w-7xl space-y-6 md:space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight md:text-3xl">Upcoming Fixtures</h1>
        <p className="mt-1 text-muted-foreground">All remaining fixtures in the league</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : pendingMatches && pendingMatches.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pendingMatches.map((match) => (
            <FixtureCard
              key={match.id}
              match={match}
              onStart={setConfirmMatchId}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          No upcoming fixtures.
        </p>
      )}

      <StartMatchDialog
        match={confirmMatch ?? null}
        leagueId={leagueId}
        open={!!confirmMatchId}
        onOpenChange={(open) => !open && setConfirmMatchId(null)}
        onStarted={handleMatchStarted}
      />
    </div>
  );
}
