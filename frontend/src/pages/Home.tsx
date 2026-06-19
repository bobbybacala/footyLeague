import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { leaguesApi } from "@/api/client";
import { useLeagueStore } from "@/store/leagueStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const navigate = useNavigate();
  const setCurrentLeagueId = useLeagueStore((s) => s.setCurrentLeagueId);
  const { data: leagues, isLoading } = useQuery({
    queryKey: ["leagues"],
    queryFn: leaguesApi.list,
  });

  const loadLeague = (id: number) => {
    setCurrentLeagueId(id);
    navigate(`/leagues/${id}`);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary">
          Football League Portal
        </h1>
        <p className="mt-2 text-muted-foreground">
          Create, manage, and track your football leagues
        </p>
      </div>

      <div className="flex w-full flex-col gap-4 sm:flex-row">
        <Button asChild size="lg" className="flex-1">
          <Link to="/leagues/new">Create New League</Link>
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" size="lg" className="flex-1">
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
                  <Skeleton key={i} className="h-12 w-full" />
                ))
              ) : leagues && leagues.length > 0 ? (
                leagues.map((league) => (
                  <button
                    key={league.id}
                    onClick={() => loadLeague(league.id)}
                    className="w-full rounded-md border border-border p-3 text-left transition-colors hover:border-primary hover:bg-secondary"
                  >
                    <p className="font-medium">{league.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {league.venue} · {league.team_count} teams
                    </p>
                  </button>
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

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">Quick Start</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Create a league, add teams and players, configure the format, generate
          fixtures, and manage matches with live scoring.
        </CardContent>
      </Card>
    </div>
  );
}
