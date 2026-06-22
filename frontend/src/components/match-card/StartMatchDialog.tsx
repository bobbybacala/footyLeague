import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { matchesApi, teamsApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Match } from "@/types";

interface StartMatchDialogProps {
  match: Match | null;
  leagueId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStarted: (match: Match) => void;
}

export function StartMatchDialog({
  match,
  leagueId,
  open,
  onOpenChange,
  onStarted,
}: StartMatchDialogProps) {
  const { toast } = useToast();
  const [homeJersey, setHomeJersey] = useState("#22c55e");
  const [awayJersey, setAwayJersey] = useState("#3b82f6");

  const { data: teams } = useQuery({
    queryKey: ["teams", leagueId],
    queryFn: () => teamsApi.list(leagueId),
    enabled: open && !!leagueId,
  });

  useEffect(() => {
    if (!match || !open) return;
    const homeTeam = teams?.find((t) => t.id === match.home_team);
    const awayTeam = teams?.find((t) => t.id === match.away_team);
    setHomeJersey(match.home_jersey_color || homeTeam?.jersey_color || "#22c55e");
    setAwayJersey(match.away_jersey_color || awayTeam?.jersey_color || "#3b82f6");
  }, [match, open, teams]);

  const startMutation = useMutation({
    mutationFn: () =>
      matchesApi.start(match!.id, {
        home_jersey_color: homeJersey,
        away_jersey_color: awayJersey,
      }),
    onSuccess: (updated) => {
      toast("Match started!", "success");
      onOpenChange(false);
      onStarted(updated);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Match</DialogTitle>
          <DialogDescription>
            Choose jersey colors for this match before kickoff.
            {match && (
              <span className="mt-2 block font-medium text-foreground">
                {match.home_team_name} vs {match.away_team_name}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {match && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{match.home_team_name}</Label>
              <input
                type="color"
                value={homeJersey}
                onChange={(e) => setHomeJersey(e.target.value)}
                className="h-10 w-full cursor-pointer rounded border border-border bg-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label>{match.away_team_name}</Label>
              <input
                type="color"
                value={awayJersey}
                onChange={(e) => setAwayJersey(e.target.value)}
                className="h-10 w-full cursor-pointer rounded border border-border bg-transparent"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => startMutation.mutate()}
            disabled={!match || startMutation.isPending}
          >
            Start Match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
