import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Crown, Goal, LogOut, Shield, Swords, Users } from "lucide-react";
import { leaguesApi } from "@/api/client";
import { useLeagueStore } from "@/store/leagueStore";
import { PageShell } from "@/components/layout/PageShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { PointsTable } from "@/components/points-table/PointsTable";
import { MatchCard } from "@/components/match-card/MatchCard";
import { AwardsPanel } from "@/components/awards-panel/AwardsPanel";
import { MatchDetailsDialog } from "@/components/match-card/MatchDetailsDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Match } from "@/types";

interface DashboardProps {
  leagueId: number;
}

export default function Dashboard({ leagueId }: DashboardProps) {
  const navigate = useNavigate();
  const setCurrentLeagueId = useLeagueStore((s) => s.setCurrentLeagueId);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const { data: league, isLoading: leagueLoading } = useQuery({
    queryKey: ["league", leagueId],
    queryFn: () => leaguesApi.get(leagueId),
  });

  const { data: standings, isLoading: standingsLoading } = useQuery({
    queryKey: ["standings", leagueId],
    queryFn: () => leaguesApi.standings(leagueId),
  });

  const { data: awards, isLoading: awardsLoading } = useQuery({
    queryKey: ["awards", leagueId],
    queryFn: () => leaguesApi.awards(leagueId),
  });

  const { data: finishedMatches, isLoading: finishedLoading } = useQuery({
    queryKey: ["matches", leagueId, "FINISHED"],
    queryFn: () => leaguesApi.matches(leagueId, "FINISHED"),
  });

  const recentResults = finishedMatches ?? [];
  const isConcluded = league?.status === "COMPLETED";
  const champion = isConcluded && standings?.length ? standings[0] : null;
  const totalGoals = useMemo(
    () => (standings ?? []).reduce((sum, row) => sum + row.goals_for, 0),
    [standings]
  );

  const exitLeague = () => {
    setCurrentLeagueId(null);
    navigate("/");
  };

  return (
    <>
      <PageShell
        header={
          <div className="hidden md:block">
            <h1 className="text-xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              {league?.name} · {league?.venue}
            </p>
          </div>
        }
        contentClassName={isConcluded ? "pb-24 md:pb-28" : undefined}
        footer={
          isConcluded ? (
            <div className="fixed bottom-0 left-0 right-0 z-30 hidden border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:left-64 md:block">
              <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row md:px-6 md:py-4">
                <p className="text-sm text-muted-foreground">
                  League concluded — you can exit the league when you&apos;re done.
                </p>
                <Button variant="outline" onClick={exitLeague}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Exit League
                </Button>
              </div>
            </div>
          ) : undefined
        }
      >
        <div className="hidden gap-4 sm:grid-cols-2 md:grid lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="Total Teams"
            value={league?.team_count ?? 0}
            icon={Shield}
            isLoading={leagueLoading}
          />
          <StatCard
            label="Total Players"
            value={league?.player_count ?? 0}
            icon={Users}
            isLoading={leagueLoading}
          />
          <StatCard
            label="Matches Played"
            value={league?.matches_played ?? 0}
            icon={Swords}
            isLoading={leagueLoading}
          />
          <StatCard
            label="Matches Remaining"
            value={league?.matches_remaining ?? 0}
            icon={Calendar}
            isLoading={leagueLoading}
          />
          <StatCard
            label="Total Goals Scored"
            value={totalGoals}
            icon={Goal}
            isLoading={standingsLoading}
          />
        </div>

        {champion && (
          <div className="hidden rounded-xl border border-primary/40 bg-primary/10 px-4 py-4 text-center md:block md:px-6 md:py-5">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              Congratulations, Champions!
            </p>
            <p className="mt-2 text-xl font-bold md:text-2xl">{champion.team_name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {champion.points} pts · {champion.wins}W {champion.draws}D {champion.losses}L
            </p>
          </div>
        )}

        <div className="grid min-w-0 gap-6 xl:grid-cols-3">
          <PointsTable standings={standings ?? []} isLoading={standingsLoading} />

          <div className="flex min-h-0 flex-col space-y-4">
            <h2 className="text-lg font-semibold">Recent Results</h2>
            {finishedLoading ? (
              <Skeleton className="h-[32rem] w-full" />
            ) : recentResults.length > 0 ? (
              <div className="space-y-2.5">
                {recentResults.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onClick={() => setSelectedMatch(match)}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No completed matches yet.
              </p>
            )}
          </div>

          <div className="hidden md:block">
            <AwardsPanel leagueId={leagueId} awards={awards} isLoading={awardsLoading} />
          </div>
        </div>
      </PageShell>

      <MatchDetailsDialog
        match={selectedMatch}
        open={!!selectedMatch}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
      />
    </>
  );
}
