import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leaguesApi, getErrorMessage } from "@/api/client";
import { useLeagueStore } from "@/store/leagueStore";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Trophy } from "lucide-react";
import type { League } from "@/types";

function getLeagueRoute(league: League): string {
  if (league.status === "DRAFT") {
    if (league.team_count < 2) return `/leagues/${league.id}/setup/teams`;
    return `/leagues/${league.id}/setup/players`;
  }
  return `/leagues/${league.id}`;
}

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const setCurrentLeagueId = useLeagueStore((s) => s.setCurrentLeagueId);
  const [deleteLeague, setDeleteLeague] = useState<League | null>(null);

  const { data: leagues, isLoading } = useQuery({
    queryKey: ["leagues"],
    queryFn: leaguesApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => leaguesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leagues"] });
      toast("League deleted", "success");
      setDeleteLeague(null);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const loadLeague = (league: League) => {
    setCurrentLeagueId(league.id);
    navigate(getLeagueRoute(league));
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-4 md:gap-8 md:p-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 md:mb-4 md:h-14 md:w-14">
          <Trophy className="h-6 w-6 text-primary md:h-7 md:w-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Football League</h1>
        <p className="mt-2 text-muted-foreground">
          Create, manage, and track your football leagues
        </p>
      </div>

      <div className="flex w-full flex-col gap-4 sm:flex-row">
        <Button asChild size="lg" className="h-auto flex-1 py-4 md:h-11 md:py-2">
          <Link to="/leagues/new">Create New League</Link>
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" size="lg" className="h-auto flex-1 py-4 md:h-11 md:py-2">
              Load Existing League
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select a League</DialogTitle>
            </DialogHeader>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))
              ) : leagues && leagues.length > 0 ? (
                leagues.map((league) => (
                  <div
                    key={league.id}
                    className="flex items-center gap-2 rounded-lg border border-border transition-colors hover:border-primary"
                  >
                    <button
                      onClick={() => loadLeague(league)}
                      className="min-w-0 flex-1 p-4 text-left hover:bg-secondary"
                    >
                      <p className="font-medium">{league.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {league.venue} · {league.team_count} teams · {league.status}
                      </p>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-2 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => setDeleteLeague(league)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No leagues found. Create one to get started.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="w-full border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Quick Start</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Create a league, add teams and players, configure settings, generate
          fixtures, and manage matches with live scoring.
        </CardContent>
      </Card>

      <Dialog open={!!deleteLeague} onOpenChange={(o) => !o && setDeleteLeague(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete League</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">{deleteLeague?.name}</span>?
              All teams, players, matches, and stats will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteLeague(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteLeague && deleteMutation.mutate(deleteLeague.id)}
              disabled={deleteMutation.isPending}
            >
              Delete League
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
