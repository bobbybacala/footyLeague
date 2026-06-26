import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { leaguesApi, matchesApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { MatchCard } from "@/components/match-card/MatchCard";
import { MatchDetailsDialog } from "@/components/match-card/MatchDetailsDialog";
import { FixtureCard } from "@/components/fixture-card/FixtureCard";
import { StartMatchDialog } from "@/components/match-card/StartMatchDialog";
import { CreateMatchdayDialog } from "@/components/matchday/CreateMatchdayDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { filterMatchesBySearch } from "@/lib/matchSearch";
import type { Match } from "@/types";

function formatMatchdayDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
  const [showCreateMatchday, setShowCreateMatchday] = useState(false);
  const [selectedMatchdayId, setSelectedMatchdayId] = useState("all");

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

  const { data: matchdays, isLoading: matchdaysLoading } = useQuery({
    queryKey: ["matchdays", leagueId],
    queryFn: () => leaguesApi.matchdays(leagueId),
  });

  const upcomingMatches = useMemo(
    () => [...(liveMatches ?? []), ...(pendingMatches ?? [])],
    [liveMatches, pendingMatches]
  );

  const selectedMatchday = useMemo(
    () => matchdays?.find((m) => String(m.id) === selectedMatchdayId) ?? null,
    [matchdays, selectedMatchdayId]
  );

  const matchdayMatchIds = useMemo(() => {
    if (!selectedMatchday) return null;
    return new Set(selectedMatchday.matches.map((m) => m.id));
  }, [selectedMatchday]);

  const displayedUpcoming = useMemo(() => {
    let base = upcomingMatches;
    if (matchdayMatchIds) {
      base = base.filter((m) => matchdayMatchIds.has(m.id));
    }
    return filterMatchesBySearch(base, search);
  }, [upcomingMatches, matchdayMatchIds, search]);

  const displayedFinished = useMemo(() => {
    let base = finishedMatches ?? [];
    if (matchdayMatchIds) {
      base = base.filter((m) => matchdayMatchIds.has(m.id));
    }
    return filterMatchesBySearch(base, search);
  }, [finishedMatches, matchdayMatchIds, search]);

  const handleMatchStarted = (match: Match) => {
    queryClient.invalidateQueries({ queryKey: ["matches", leagueId] });
    queryClient.invalidateQueries({ queryKey: ["matchdays", leagueId] });
    setConfirmMatchId(null);
    navigate(`/matches/${match.id}`);
  };

  const deleteMutation = useMutation({
    mutationFn: (matchId: number) => matchesApi.delete(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", leagueId] });
      queryClient.invalidateQueries({ queryKey: ["matchdays", leagueId] });
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-3xl">Matches</h1>
          <p className="mt-1 text-muted-foreground">
            {isConcluded ? "Completed matches" : "Upcoming and completed matches"}
          </p>
        </div>
        {!isConcluded && canEdit && (
          <Button
            className="w-full sm:w-auto"
            onClick={() => setShowCreateMatchday(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Matchday
          </Button>
        )}
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
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <TabsList className="w-full sm:w-auto">
            {!isConcluded && (
              <TabsTrigger value="upcoming">Upcoming Matches</TabsTrigger>
            )}
            <TabsTrigger value="completed">Completed Matches</TabsTrigger>
          </TabsList>

          <Select value={selectedMatchdayId} onValueChange={setSelectedMatchdayId}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Select a matchday" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All matches</SelectItem>
              {matchdaysLoading ? (
                <SelectItem value="loading" disabled>
                  Loading matchdays...
                </SelectItem>
              ) : (
                matchdays?.map((day) => (
                  <SelectItem key={day.id} value={String(day.id)}>
                    {day.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedMatchday && (
          <div className="mt-4 rounded-lg border border-border/60 bg-card/40 px-4 py-3">
            <p className="font-medium">{selectedMatchday.title}</p>
            <p className="text-sm text-muted-foreground">
              {formatMatchdayDate(selectedMatchday.date)} ·{" "}
              {selectedMatchday.matches.length} fixture
              {selectedMatchday.matches.length === 1 ? "" : "s"}
            </p>
          </div>
        )}

        {!isConcluded && (
        <TabsContent value="upcoming">
          {pendingLoading || liveLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : displayedUpcoming.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedUpcoming.map((match) => (
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
              {search.trim()
                ? "No matches match your search."
                : selectedMatchday
                  ? "No upcoming fixtures on this matchday."
                  : "No upcoming matches."}
            </p>
          )}
        </TabsContent>
        )}

        <TabsContent value="completed">
          {finishedLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : displayedFinished.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedFinished.map((match) => (
                <div key={match.id} className="space-y-2">
                  <MatchCard match={match} onClick={() => setSelectedMatch(match)} />
                  {!isConcluded && canEdit && (
                    <div className="flex gap-2">
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              {search.trim()
                ? "No matches match your search."
                : selectedMatchday
                  ? "No completed results on this matchday yet."
                  : "No completed matches yet."}
            </p>
          )}
        </TabsContent>
      </Tabs>

      <MatchDetailsDialog
        match={selectedMatch}
        open={!!selectedMatch}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
      />

      <StartMatchDialog
        match={confirmMatch ?? null}
        leagueId={leagueId}
        open={!!confirmMatchId}
        onOpenChange={(open) => !open && setConfirmMatchId(null)}
        onStarted={handleMatchStarted}
      />

      <CreateMatchdayDialog
        leagueId={leagueId}
        pendingMatches={pendingMatches ?? []}
        matchdays={matchdays ?? []}
        open={showCreateMatchday}
        onOpenChange={setShowCreateMatchday}
        onCreated={(matchday) => {
          queryClient.invalidateQueries({ queryKey: ["matchdays", leagueId] });
          setSelectedMatchdayId(String(matchday.id));
        }}
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
