import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { leaguesApi } from "@/api/client";
import type { AwardLeader, Awards, Player } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface AwardsPanelProps {
  leagueId: number;
  awards?: Awards;
  isLoading?: boolean;
}

type StatKey = "goals" | "assists" | "clean_sheets";

function LeaderRow({
  playerName,
  teamName,
  value,
  suffix,
}: {
  playerName: string;
  teamName: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm">
      <span className="font-semibold text-primary">{playerName}</span>
      <span>
        {value} {suffix}
      </span>
      <span className="text-muted-foreground">({teamName})</span>
    </div>
  );
}

function AwardSection({
  title,
  modalTitle,
  leaders,
  suffix,
  statKey,
  players,
  goalkeepersOnly = false,
}: {
  title: string;
  modalTitle: string;
  leaders: AwardLeader[];
  suffix: string;
  statKey: StatKey;
  players: Player[];
  goalkeepersOnly?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);

  const allRanked = useMemo(() => {
    const pool = goalkeepersOnly
      ? players.filter((p) => p.position === "GOALKEEPER")
      : players;
    return pool
      .filter((p) => p[statKey] > 0)
      .sort((a, b) => b[statKey] - a[statKey] || a.name.localeCompare(b.name));
  }, [players, statKey, goalkeepersOnly]);

  return (
    <>
      <div className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
          {allRanked.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 px-2 text-xs text-primary hover:text-primary"
              onClick={() => setShowAll(true)}
            >
              Show all
            </Button>
          )}
        </div>
        {leaders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet</p>
        ) : (
          <div className="space-y-1.5">
            {leaders.map((leader) => (
              <LeaderRow
                key={`${title}-${leader.player_id}`}
                playerName={leader.player_name}
                teamName={leader.team_name}
                value={leader.value}
                suffix={suffix}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAll} onOpenChange={setShowAll}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          {allRanked.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <ul className="max-h-[min(60dvh,24rem)] space-y-2 overflow-y-auto">
              {allRanked.map((player) => (
                <li key={player.id}>
                  <LeaderRow
                    playerName={player.name}
                    teamName={player.team_name}
                    value={player[statKey]}
                    suffix={suffix}
                  />
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AwardsPanel({ leagueId, awards, isLoading }: AwardsPanelProps) {
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ["league-players", leagueId],
    queryFn: () => leaguesApi.players(leagueId),
    enabled: !!leagueId,
  });

  const loading = isLoading || playersLoading;

  return (
    <Card className="h-full border-border/60">
      <CardHeader>
        <CardTitle>League Awards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <>
            <AwardSection
              title="Top Scorer"
              modalTitle="Goal Scorers"
              leaders={awards?.top_scorer ?? []}
              suffix="Goals"
              statKey="goals"
              players={players ?? []}
            />
            <AwardSection
              title="Top Assister"
              modalTitle="Assists"
              leaders={awards?.top_assister ?? []}
              suffix="Assists"
              statKey="assists"
              players={players ?? []}
            />
            <AwardSection
              title="Most Clean Sheets"
              modalTitle="Clean Sheets"
              leaders={awards?.most_clean_sheets ?? []}
              suffix="Clean Sheets"
              statKey="clean_sheets"
              players={players ?? []}
              goalkeepersOnly
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
