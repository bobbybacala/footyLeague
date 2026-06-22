import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { leaguesApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeagueFormat } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

export default function SetupSettings() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [format, setFormat] = useState<LeagueFormat>("SINGLE_ROUND_ROBIN");
  const [pointsWin, setPointsWin] = useState(3);
  const [pointsDraw, setPointsDraw] = useState(1);

  const { data: league, isLoading } = useQuery({
    queryKey: ["league", leagueId],
    queryFn: () => leaguesApi.get(leagueId),
    enabled: !!leagueId,
  });

  useEffect(() => {
    if (league) {
      setFormat(league.format);
      setPointsWin(league.points_win);
      setPointsDraw(league.points_draw);
    }
  }, [league]);

  const mutation = useMutation({
    mutationFn: async () => {
      await leaguesApi.update(leagueId, {
        format,
        points_win: pointsWin,
        points_draw: pointsDraw,
      });
    },
    onSuccess: () => {
      toast("Settings saved!", "success");
      navigate(`/leagues/${leagueId}/generate-fixtures`);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6 md:p-8">
      <div>
        <p className="text-sm font-medium text-primary">Step 4 of 6</p>
        <h1 className="text-2xl font-bold">League Settings</h1>
        <p className="text-muted-foreground">Configure format for {league?.name}</p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        League setup is currently in progress. You cannot go back to previous steps.
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Competition Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors has-[:checked]:border-primary">
            <input
              type="radio"
              name="format"
              checked={format === "SINGLE_ROUND_ROBIN"}
              onChange={() => setFormat("SINGLE_ROUND_ROBIN")}
              className="mt-1 accent-primary"
            />
            <div>
              <p className="font-medium">Round Robin Once</p>
              <p className="text-sm text-muted-foreground">
                Each team plays every other team once
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors has-[:checked]:border-primary">
            <input
              type="radio"
              name="format"
              checked={format === "DOUBLE_ROUND_ROBIN"}
              onChange={() => setFormat("DOUBLE_ROUND_ROBIN")}
              className="mt-1 accent-primary"
            />
            <div>
              <p className="font-medium">Round Robin Twice (Home & Away)</p>
              <p className="text-sm text-muted-foreground">
                Each team plays every other team twice
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Points System</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Win</label>
            <input
              type="number"
              min={1}
              value={pointsWin}
              onChange={(e) => setPointsWin(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Draw</label>
            <input
              type="number"
              min={0}
              value={pointsDraw}
              onChange={(e) => setPointsDraw(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tie Breakers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            1. Goal Difference · 2. Goals For
          </p>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        Continue to Generate Fixtures
      </Button>
    </div>
  );
}
