import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { leaguesApi } from "@/api/client";
import { PageShell } from "@/components/layout/PageShell";
import { PointsTable } from "@/components/points-table/PointsTable";
import { AwardsPanel } from "@/components/awards-panel/AwardsPanel";

export default function StatisticsPage() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);

  const { data: standings, isLoading: standingsLoading } = useQuery({
    queryKey: ["standings", leagueId],
    queryFn: () => leaguesApi.standings(leagueId),
  });

  const { data: awards, isLoading: awardsLoading } = useQuery({
    queryKey: ["awards", leagueId],
    queryFn: () => leaguesApi.awards(leagueId),
  });

  return (
    <PageShell
      header={
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-3xl">Statistics</h1>
          <p className="mt-1 text-muted-foreground">
            League standings and individual awards
          </p>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <PointsTable standings={standings ?? []} isLoading={standingsLoading} />
        <AwardsPanel leagueId={leagueId} awards={awards} isLoading={awardsLoading} />
      </div>
    </PageShell>
  );
}
