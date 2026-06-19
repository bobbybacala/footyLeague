import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { matchesApi, playersApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { EventTimeline } from "@/components/match-card/EventTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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

type ActionType = "goal" | "yellow" | "red" | null;

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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    if (match) {
      queryClient.invalidateQueries({ queryKey: ["matches", match.league] });
      queryClient.invalidateQueries({ queryKey: ["standings", match.league] });
      queryClient.invalidateQueries({ queryKey: ["awards", match.league] });
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
      toast("Match ended!", "success");
      navigate(`/leagues/${updated.league}`);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

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

  const teamPlayers =
    side === "home" ? homePlayersQuery.data : awayPlayersQuery.data;

  if (isLoading || !match) {
    return (
      <div className="p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isLive = match.status === "LIVE";

  const TeamActions = ({
    teamSide,
    teamName,
  }: {
    teamSide: "home" | "away";
    teamName: string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{teamName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button
          disabled={!isLive}
          onClick={() => openAction("goal", teamSide)}
        >
          Goal
        </Button>
        <Button
          variant="secondary"
          disabled={!isLive}
          onClick={() => openAction("yellow", teamSide)}
        >
          Yellow Card
        </Button>
        <Button
          variant="destructive"
          disabled={!isLive}
          onClick={() => openAction("red", teamSide)}
        >
          Red Card
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          {match.home_team_name} vs {match.away_team_name}
        </h1>
        <p className="mt-2 text-5xl font-bold text-primary">
          {match.home_score} - {match.away_score}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{match.status}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TeamActions teamSide="home" teamName={match.home_team_name} />
        <TeamActions teamSide="away" teamName={match.away_team_name} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <EventTimeline events={match.events} />
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => navigate(`/leagues/${match.league}`)}
        >
          Back to Dashboard
        </Button>
        {isLive && (
          <Button
            variant="destructive"
            onClick={() => endMutation.mutate()}
            disabled={endMutation.isPending}
          >
            End Match
          </Button>
        )}
      </div>

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
                    {teamPlayers?.map((p) => (
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
                      ?.filter((p) => String(p.id) !== scorerId)
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
                onClick={() => goalMutation.mutate()}
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
                    {teamPlayers?.map((p) => (
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
                onClick={() =>
                  action === "yellow"
                    ? yellowMutation.mutate()
                    : redMutation.mutate()
                }
              >
                Confirm
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
