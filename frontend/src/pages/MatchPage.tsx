import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Goal, RotateCcw, Square, Trash2 } from "lucide-react";
import { matchesApi, playersApi, teamsApi, leaguesApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { EventTimeline } from "@/components/match-card/EventTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { MatchEvent } from "@/types";

type ActionType = "goal" | "yellow" | "red" | null;

function cloneEvents(events: MatchEvent[]): MatchEvent[] {
  return events.map((e) => ({ ...e }));
}

function eventsFingerprint(events: MatchEvent[]): string {
  return events
    .map((e) => `${e.event_type}:${e.player}:${e.assist_player ?? ""}`)
    .join("|");
}

function computeScores(
  events: MatchEvent[],
  homeTeamId: number,
  awayTeamId: number
): { home_score: number; away_score: number } {
  return {
    home_score: events.filter(
      (e) => e.event_type === "GOAL" && e.team === homeTeamId
    ).length,
    away_score: events.filter(
      (e) => e.event_type === "GOAL" && e.team === awayTeamId
    ).length,
  };
}

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const matchId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [action, setAction] = useState<ActionType>(null);
  const [side, setSide] = useState<"home" | "away">("home");
  const [scorerId, setScorerId] = useState("");
  const [assistId, setAssistId] = useState("");
  const [cardPlayerId, setCardPlayerId] = useState("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [removeEventId, setRemoveEventId] = useState<number | null>(null);
  const [showDeleteMatchConfirm, setShowDeleteMatchConfirm] = useState(false);
  const [showDiscardJerseyConfirm, setShowDiscardJerseyConfirm] = useState(false);
  const [showDiscardEventsConfirm, setShowDiscardEventsConfirm] = useState(false);
  const [savedEvents, setSavedEvents] = useState<MatchEvent[]>([]);
  const [draftEvents, setDraftEvents] = useState<MatchEvent[]>([]);
  const tempEventIdRef = useRef(-1);
  const eventsInitializedRef = useRef<number | null>(null);
  const [homeJersey, setHomeJersey] = useState("#22c55e");
  const [awayJersey, setAwayJersey] = useState("#3b82f6");

  const { data: match, isLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => matchesApi.get(matchId),
    enabled: !!matchId,
    refetchInterval: (query) =>
      query.state.data?.status === "LIVE" ? 5000 : false,
  });

  const homePlayersQuery = useQuery({
    queryKey: ["players", match?.home_team],
    queryFn: () => playersApi.list(match!.home_team),
    enabled: !!match?.home_team,
  });

  const awayPlayersQuery = useQuery({
    queryKey: ["players", match?.away_team],
    queryFn: () => playersApi.list(match!.away_team),
    enabled: !!match?.away_team,
  });

  const { data: teams } = useQuery({
    queryKey: ["teams", match?.league],
    queryFn: () => teamsApi.list(match!.league),
    enabled: !!match?.league,
  });

  const { data: league } = useQuery({
    queryKey: ["league", match?.league],
    queryFn: () => leaguesApi.get(match!.league),
    enabled: !!match?.league,
  });

  useEffect(() => {
    if (match && teams) {
      const homeTeam = teams.find((t) => t.id === match.home_team);
      const awayTeam = teams.find((t) => t.id === match.away_team);
      setHomeJersey(match.home_jersey_color || homeTeam?.jersey_color || "#22c55e");
      setAwayJersey(match.away_jersey_color || awayTeam?.jersey_color || "#3b82f6");
    }
  }, [match, teams]);

  useEffect(() => {
    if (match && eventsInitializedRef.current !== matchId) {
      const events = cloneEvents(match.events);
      setSavedEvents(events);
      setDraftEvents(events);
      eventsInitializedRef.current = matchId;
    }
  }, [match, matchId]);

  const jerseyMutation = useMutation({
    mutationFn: (payload: { home_jersey_color: string; away_jersey_color: string }) =>
      matchesApi.update(matchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
      toast("Jersey colors saved", "success");
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    if (match) {
      queryClient.invalidateQueries({ queryKey: ["matches", match.league] });
      queryClient.invalidateQueries({ queryKey: ["standings", match.league] });
      queryClient.invalidateQueries({ queryKey: ["awards", match.league] });
      queryClient.invalidateQueries({ queryKey: ["league", match.league] });
      queryClient.invalidateQueries({ queryKey: ["league-players", match.league] });
    }
  };

  const goalMutation = useMutation({
    mutationFn: () =>
      matchesApi.goal(matchId, {
        scorer_id: Number(scorerId),
        assist_id: assistId ? Number(assistId) : null,
      }),
    onSuccess: () => {
      invalidateAll();
      toast("Goal recorded!", "success");
      closeDialog();
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const yellowMutation = useMutation({
    mutationFn: () => matchesApi.yellowCard(matchId, Number(cardPlayerId)),
    onSuccess: () => {
      invalidateAll();
      toast("Yellow card recorded!", "success");
      closeDialog();
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const redMutation = useMutation({
    mutationFn: () => matchesApi.redCard(matchId, Number(cardPlayerId)),
    onSuccess: () => {
      invalidateAll();
      toast("Red card recorded!", "success");
      closeDialog();
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const endMutation = useMutation({
    mutationFn: () => matchesApi.end(matchId),
    onSuccess: (updated) => {
      invalidateAll();
      toast("Match finished!", "success");
      setShowEndConfirm(false);
      navigate(`/leagues/${updated.league}/matches`);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const undoMutation = useMutation({
    mutationFn: () => matchesApi.undo(matchId),
    onSuccess: () => {
      invalidateAll();
      toast("Last event undone", "success");
      setShowUndoConfirm(false);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const removeMutation = useMutation({
    mutationFn: (eventId: number) => matchesApi.removeEvent(matchId, eventId),
    onSuccess: () => {
      invalidateAll();
      toast("Event removed", "success");
      setRemoveEventId(null);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const deleteMatchMutation = useMutation({
    mutationFn: () => matchesApi.delete(matchId),
    onSuccess: () => {
      if (match) {
        queryClient.invalidateQueries({ queryKey: ["matches", match.league] });
        queryClient.invalidateQueries({ queryKey: ["standings", match.league] });
        queryClient.invalidateQueries({ queryKey: ["league", match.league] });
      }
      toast("Match moved to upcoming", "success");
      navigate(`/leagues/${match!.league}/matches`);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const saveEditsMutation = useMutation({
    mutationFn: async () => {
      const draftPersistedIds = new Set(
        draftEvents.filter((e) => e.id > 0).map((e) => e.id)
      );

      for (const event of savedEvents) {
        if (!draftPersistedIds.has(event.id)) {
          await matchesApi.removeEvent(matchId, event.id);
        }
      }

      for (const event of draftEvents) {
        if (event.id < 0) {
          if (event.event_type === "GOAL") {
            await matchesApi.goal(matchId, {
              scorer_id: event.player,
              assist_id: event.assist_player,
            });
          } else if (event.event_type === "YELLOW_CARD") {
            await matchesApi.yellowCard(matchId, event.player);
          } else if (event.event_type === "RED_CARD") {
            await matchesApi.redCard(matchId, event.player);
          }
        }
      }
    },
    onSuccess: async () => {
      invalidateAll();
      const updated = await matchesApi.get(matchId);
      const events = cloneEvents(updated.events);
      setSavedEvents(events);
      setDraftEvents(events);
      toast("Changes saved", "success");
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const nextTempEventId = () => {
    const id = tempEventIdRef.current;
    tempEventIdRef.current -= 1;
    return id;
  };

  const addDraftEvent = (event: Omit<MatchEvent, "id" | "created_at">) => {
    setDraftEvents((prev) => [
      ...prev,
      {
        ...event,
        id: nextTempEventId(),
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const discardEventChanges = () => {
    setDraftEvents(cloneEvents(savedEvents));
    setShowDiscardEventsConfirm(false);
    toast("Changes discarded", "success");
  };

  const closeDialog = () => {
    setAction(null);
    setScorerId("");
    setAssistId("");
    setCardPlayerId("");
  };

  const openAction = (type: ActionType, teamSide: "home" | "away") => {
    setSide(teamSide);
    setAction(type);
  };

  if (isLoading || !match) {
    return (
      <div className="p-6">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const isConcluded = league?.status === "COMPLETED";
  const isEditable = (isLive || isFinished) && !isConcluded;
  const canEditJerseys = match.status === "PENDING" && !isConcluded;

  const homeTeam = teams?.find((t) => t.id === match.home_team);
  const awayTeam = teams?.find((t) => t.id === match.away_team);
  const savedHomeJersey =
    match.home_jersey_color || homeTeam?.jersey_color || "#22c55e";
  const savedAwayJersey =
    match.away_jersey_color || awayTeam?.jersey_color || "#3b82f6";
  const jerseyDirty =
    canEditJerseys &&
    (homeJersey !== savedHomeJersey || awayJersey !== savedAwayJersey);

  const activePlayers = (players: typeof homePlayersQuery.data) =>
    players?.filter((p) => !p.is_inactive) ?? [];

  const teamPlayers =
    side === "home"
      ? activePlayers(homePlayersQuery.data)
      : activePlayers(awayPlayersQuery.data);

  const displayEvents = isFinished ? draftEvents : match.events;
  const { home_score: displayHomeScore, away_score: displayAwayScore } = isFinished
    ? computeScores(draftEvents, match.home_team, match.away_team)
    : { home_score: match.home_score, away_score: match.away_score };
  const eventsDirty =
    isFinished && eventsFingerprint(savedEvents) !== eventsFingerprint(draftEvents);

  const confirmGoal = () => {
    if (isFinished) {
      const scorer = teamPlayers.find((p) => String(p.id) === scorerId);
      if (!scorer) return;
      const assist = assistId
        ? teamPlayers.find((p) => String(p.id) === assistId)
        : null;
      const teamId = side === "home" ? match.home_team : match.away_team;
      const teamName =
        side === "home" ? match.home_team_name : match.away_team_name;
      addDraftEvent({
        event_type: "GOAL",
        player: scorer.id,
        player_name: scorer.name,
        assist_player: assist?.id ?? null,
        assist_player_name: assist?.name ?? null,
        team: teamId,
        team_name: teamName,
      });
      closeDialog();
      return;
    }
    goalMutation.mutate();
  };

  const confirmCard = () => {
    if (isFinished) {
      const player = teamPlayers.find((p) => String(p.id) === cardPlayerId);
      if (!player) return;
      const teamId = side === "home" ? match.home_team : match.away_team;
      const teamName =
        side === "home" ? match.home_team_name : match.away_team_name;
      addDraftEvent({
        event_type: action === "yellow" ? "YELLOW_CARD" : "RED_CARD",
        player: player.id,
        player_name: player.name,
        assist_player: null,
        assist_player_name: null,
        team: teamId,
        team_name: teamName,
      });
      closeDialog();
      return;
    }
    if (action === "yellow") {
      yellowMutation.mutate();
    } else {
      redMutation.mutate();
    }
  };

  const confirmRemoveEvent = () => {
    if (!removeEventId) return;
    if (isFinished) {
      setDraftEvents((prev) => prev.filter((e) => e.id !== removeEventId));
      setRemoveEventId(null);
      return;
    }
    removeMutation.mutate(removeEventId);
  };

  const removeEvent = displayEvents.find((e) => e.id === removeEventId);

  const TeamActions = ({
    teamSide,
    teamName,
  }: {
    teamSide: "home" | "away";
    teamName: string;
  }) => (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{teamName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button disabled={!isEditable} onClick={() => openAction("goal", teamSide)}>
          <Goal className="h-4 w-4" />
          Goal
        </Button>
        <Button
          variant="secondary"
          disabled={!isEditable}
          onClick={() => openAction("yellow", teamSide)}
        >
          <Square className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          Yellow Card
        </Button>
        <Button
          variant="destructive"
          disabled={!isEditable}
          onClick={() => openAction("red", teamSide)}
        >
          <Square className="h-3 w-3 fill-red-500 text-red-500" />
          Red Card
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 pb-28">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => navigate(`/leagues/${match.league}/matches`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Matches
      </Button>

      {isFinished && !isConcluded && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteMatchConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Reset Match
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {match.status}
        </p>
        <h1 className="mt-2 text-xl font-semibold md:text-2xl">
          {match.home_team_name} vs {match.away_team_name}
        </h1>
        <p className="mt-4 text-6xl font-bold tracking-tight text-primary">
          {displayHomeScore} - {displayAwayScore}
        </p>
        <div className="mt-6 flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-full border border-border"
              style={{ backgroundColor: homeJersey }}
            />
            <span className="text-sm text-muted-foreground">{match.home_team_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-full border border-border"
              style={{ backgroundColor: awayJersey }}
            />
            <span className="text-sm text-muted-foreground">{match.away_team_name}</span>
          </div>
        </div>
      </div>

      {canEditJerseys && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Jersey Colors</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
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
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              {jerseyDirty && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDiscardJerseyConfirm(true)}
                >
                  Discard Changes
                </Button>
              )}
              <Button
                className="flex-1"
                variant="secondary"
                onClick={() =>
                  jerseyMutation.mutate({
                    home_jersey_color: homeJersey,
                    away_jersey_color: awayJersey,
                  })
                }
                disabled={jerseyMutation.isPending || !jerseyDirty}
              >
                Save Jersey Colors
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isEditable && (
        <div className="grid gap-4 sm:grid-cols-2">
          <TeamActions teamSide="home" teamName={match.home_team_name} />
          <TeamActions teamSide="away" teamName={match.away_team_name} />
        </div>
      )}

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Match Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <EventTimeline
            events={displayEvents}
            editable={isEditable}
            onRemoveEvent={setRemoveEventId}
          />
        </CardContent>
      </Card>

      {isFinished && eventsDirty && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="mx-auto flex max-w-4xl gap-3 p-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDiscardEventsConfirm(true)}
              disabled={saveEditsMutation.isPending}
            >
              Discard Changes
            </Button>
            <Button
              className="flex-1"
              onClick={() => saveEditsMutation.mutate()}
              disabled={saveEditsMutation.isPending}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {isLive && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="mx-auto flex max-w-4xl gap-3 p-4">
            <Button
              variant="outline"
              className="flex-1"
              disabled={!match.events.length || undoMutation.isPending}
              onClick={() => setShowUndoConfirm(true)}
            >
              <RotateCcw className="h-4 w-4" />
              Undo Last Event
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setShowEndConfirm(true)}
              disabled={endMutation.isPending}
            >
              Finish Match
            </Button>
          </div>
        </div>
      )}

      <Dialog open={!!action} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "goal" && "Record Goal"}
              {action === "yellow" && "Yellow Card"}
              {action === "red" && "Red Card"}
            </DialogTitle>
          </DialogHeader>

          {action === "goal" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Goal Scorer</Label>
                <Select value={scorerId} onValueChange={setScorerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scorer" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamPlayers.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assister (optional)</Label>
                <Select value={assistId} onValueChange={setAssistId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assister" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamPlayers
                      .filter((p) => String(p.id) !== scorerId)
                      .map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!scorerId || goalMutation.isPending}
                onClick={confirmGoal}
              >
                Confirm Goal
              </Button>
            </div>
          )}

          {(action === "yellow" || action === "red") && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Player</Label>
                <Select value={cardPlayerId} onValueChange={setCardPlayerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamPlayers.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!cardPlayerId}
                onClick={confirmCard}
              >
                Confirm
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish Match</DialogTitle>
            <DialogDescription>
              Are you sure you want to finish this match? Final score: {match.home_score} -{" "}
              {match.away_score}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => endMutation.mutate()}
              disabled={endMutation.isPending}
            >
              Finish Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUndoConfirm} onOpenChange={setShowUndoConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undo Last Event</DialogTitle>
            <DialogDescription>
              This will remove the most recent event from the match timeline.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUndoConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={() => undoMutation.mutate()} disabled={undoMutation.isPending}>
              Undo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!removeEventId} onOpenChange={(o) => !o && setRemoveEventId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this event from the match?
              {removeEvent && (
                <span className="mt-2 block font-medium text-foreground">
                  {removeEvent.player_name} — {removeEvent.event_type.replace("_", " ")}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveEventId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveEvent}
              disabled={!isFinished && removeMutation.isPending}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDiscardEventsConfirm} onOpenChange={setShowDiscardEventsConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard Changes</DialogTitle>
            <DialogDescription>
              Revert all unsaved match edits? Goals, cards, and timeline changes will be
              lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiscardEventsConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={discardEventChanges}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDiscardJerseyConfirm} onOpenChange={setShowDiscardJerseyConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard Changes</DialogTitle>
            <DialogDescription>
              Revert jersey colors to the last saved values?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiscardJerseyConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setHomeJersey(savedHomeJersey);
                setAwayJersey(savedAwayJersey);
                setShowDiscardJerseyConfirm(false);
                toast("Changes discarded", "success");
              }}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteMatchConfirm} onOpenChange={setShowDeleteMatchConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Match</DialogTitle>
            <DialogDescription>
              Reset this completed match? It will move back to upcoming matches and all
              events will be cleared.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteMatchConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMatchMutation.mutate()}
              disabled={deleteMatchMutation.isPending}
            >
              Reset Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
