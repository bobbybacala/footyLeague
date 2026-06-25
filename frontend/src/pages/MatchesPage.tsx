import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { leaguesApi, matchesApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { MatchCard } from "@/components/match-card/MatchCard";
import { EventTimeline } from "@/components/match-card/EventTimeline";
import { FixtureCard } from "@/components/fixture-card/FixtureCard";
import { StartMatchDialog } from "@/components/match-card/StartMatchDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCanEdit } from "@/context/AppRoleContext";
import type { Match } from "@/types";

function filterByTeam(matches: Match[], search: string): Match[] {
  const q = search.trim().toLowerCase();
  if (!q) return matches;
  return matches.filter(
    (m) =>
      m.home_team_name.toLowerCase().includes(q) ||
      m.away_team_name.toLowerCase().includes(q)
  );
}

export default function MatchesPage() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const canEdit = useCanEdit();
  const [search, setSearch] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [confirmMatchId, setConfirmMatchId] = useState<number | null>(null);
  const [deleteMatchId, setDeleteMatchId] = useState<number | null>(null);

  const { data: league } = useQuery({
    queryKey: ["league", leagueId],
    queryFn: () => leaguesApi.get(leagueId),
  });

  const isConcluded = league?.status === "COMPLETED";

  const { data: pendingMatches, isLoading: pendingLoading } = useQuery({
    queryKey: ["matches", leagueId, "PENDING"],
    queryFn: () => leaguesApi.matches(leagueId, "PENDING"),
    enabled: !isConcluded,
  });

  const { data: liveMatches, isLoading: liveLoading } = useQuery({
    queryKey: ["matches", leagueId, "LIVE"],
    queryFn: () => leaguesApi.matches(leagueId, "LIVE"),
    enabled: !isConcluded,
  });

  const { data: finishedMatches, isLoading: finishedLoading } = useQuery({
    queryKey: ["matches", leagueId, "FINISHED"],
    queryFn: () => leaguesApi.matches(leagueId, "FINISHED"),
  });

  const upcomingMatches = useMemo(
    () => filterByTeam([...(liveMatches ?? []), ...(pendingMatches ?? [])], search),
    [liveMatches, pendingMatches, search]
  );

  const filteredFinished = useMemo(
    () => filterByTeam(finishedMatches ?? [], search),
    [finishedMatches, search]
  );

  const handleMatchStarted = (match: Match) => {
    queryClient.invalidateQueries({ queryKey: ["matches", leagueId] });
    setConfirmMatchId(null);
    navigate(`/matches/${match.id}`);
  };

  const deleteMutation = useMutation({
    mutationFn: (matchId: number) => matchesApi.delete(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", leagueId] });
      queryClient.invalidateQueries({ queryKey: ["standings", leagueId] });
      queryClient.invalidateQueries({ queryKey: ["league", leagueId] });
      queryClient.invalidateQueries({ queryKey: ["awards", leagueId] });
      toast("Match moved to upcoming", "success");
      setDeleteMatchId(null);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const confirmMatch = pendingMatches?.find((m) => m.id === confirmMatchId);
  const matchToDelete = finishedMatches?.find((m) => m.id === deleteMatchId) ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 md:space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight md:text-3xl">Matches</h1>
        <p className="mt-1 text-muted-foreground">
          {isConcluded ? "Completed matches" : "Upcoming and completed matches"}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by team name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue={isConcluded ? "completed" : "upcoming"}>
        <TabsList>
          {!isConcluded && (
            <TabsTrigger value="upcoming">Upcoming Matches</TabsTrigger>
          )}
          <TabsTrigger value="completed">Completed Matches</TabsTrigger>
        </TabsList>

        {!isConcluded && (
        <TabsContent value="upcoming">
          {pendingLoading || liveLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : upcomingMatches.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingMatches.map((match) => (
                <FixtureCard
                  key={match.id}
                  match={match}
                  showStart={canEdit}
                  onStart={setConfirmMatchId}
                  onContinue={(matchId) => navigate(`/matches/${matchId}`)}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              {search.trim() ? "No matches match your search." : "No upcoming matches."}
            </p>
          )}
        </TabsContent>
        )}

        <TabsContent value="completed">
          {finishedLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : filteredFinished.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFinished.map((match) => (
                <div key={match.id} className="space-y-2">
                  <MatchCard match={match} onClick={() => setSelectedMatch(match)} />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedMatch(match)}
                    >
                      View
                    </Button>
                    {!isConcluded && canEdit && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/matches/${match.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => setDeleteMatchId(match.id)}
                        >
                          Reset
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              {search.trim()
                ? "No matches match your search."
                : "No completed matches yet."}
            </p>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedMatch} onOpenChange={(o) => !o && setSelectedMatch(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Match Details</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <>
              <p className="text-center text-xl font-bold">
                {selectedMatch.home_team_name} {selectedMatch.home_score} -{" "}
                {selectedMatch.away_score} {selectedMatch.away_team_name}
              </p>
              <EventTimeline events={selectedMatch.events} />
            </>
          )}
        </DialogContent>
      </Dialog>

      <StartMatchDialog
        match={confirmMatch ?? null}
        leagueId={leagueId}
        open={!!confirmMatchId}
        onOpenChange={(open) => !open && setConfirmMatchId(null)}
        onStarted={handleMatchStarted}
      />

      <Dialog open={!!deleteMatchId} onOpenChange={(o) => !o && setDeleteMatchId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Match</DialogTitle>
            <DialogDescription>
              Reset this completed match? It will move back to upcoming matches and all
              events will be cleared.
              {matchToDelete && (
                <span className="mt-2 block font-medium text-foreground">
                  {matchToDelete.home_team_name} vs {matchToDelete.away_team_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteMatchId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMatchId && deleteMutation.mutate(deleteMatchId)}
              disabled={deleteMutation.isPending}
            >
              Reset Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
