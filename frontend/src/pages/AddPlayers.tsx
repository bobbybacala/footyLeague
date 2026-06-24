import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { playersApi, teamsApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { validateTeamPlayers } from "@/lib/teamValidation";
import { SquadPanel } from "@/components/squad/SquadPanel";
import { PlayerForm } from "@/components/player-form/PlayerForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { PlayerPosition } from "@/types";

export default function AddPlayers() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [teamIndex, setTeamIndex] = useState(0);
  const [captainId, setCaptainId] = useState("");
  const [viceCaptainId, setViceCaptainId] = useState("");

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["teams", leagueId],
    queryFn: () => teamsApi.list(leagueId),
    enabled: !!leagueId,
  });

  useEffect(() => {
    if (teams && teamIndex >= teams.length) {
      setTeamIndex(Math.max(0, teams.length - 1));
    }
  }, [teams, teamIndex]);

  const currentTeam = teams?.[teamIndex];
  const teamId = currentTeam?.id;
  const isLastTeam = teams ? teamIndex === teams.length - 1 : false;

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ["players", teamId],
    queryFn: () => playersApi.list(teamId!),
    enabled: !!teamId,
  });

  useEffect(() => {
    if (players) {
      let captain = "";
      let vice = "";
      for (const p of players) {
        if (p.is_captain) captain = String(p.id);
        if (p.is_vice_captain) vice = String(p.id);
      }
      setCaptainId(captain);
      setViceCaptainId(vice);
    } else {
      setCaptainId("");
      setViceCaptainId("");
    }
  }, [players, teamId]);

  const playersWithCaptain = useMemo(() => {
    if (!players) return [];
    return players.map((p) => ({
      ...p,
      is_captain: captainId ? String(p.id) === captainId : p.is_captain,
    }));
  }, [players, captainId]);

  const squadError = useMemo(() => {
    if (!playersWithCaptain.length) {
      return "Add at least 2 players including one goalkeeper.";
    }
    return validateTeamPlayers(playersWithCaptain);
  }, [playersWithCaptain]);

  const currentTeamValid = playersWithCaptain.length > 0 && squadError === null;

  const roleMutation = useMutation({
    mutationFn: async ({
      captain,
      vice,
    }: {
      captain: string;
      vice: string;
    }) => {
      if (!players) return;
      for (const p of players) {
        await playersApi.update(p.id, {
          is_captain: String(p.id) === captain,
          is_vice_captain: String(p.id) === vice,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players", teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams", leagueId] });
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const handleCaptainChange = (id: string) => {
    setCaptainId(id);
    roleMutation.mutate({ captain: id, vice: id === viceCaptainId ? "" : viceCaptainId });
  };

  const handleViceChange = (id: string) => {
    setViceCaptainId(id);
    roleMutation.mutate({ captain: id === captainId ? "" : captainId, vice: id });
  };

  const addPlayerMutation = useMutation({
    mutationFn: (data: { name: string; position: PlayerPosition }) =>
      playersApi.create(teamId!, { ...data, is_captain: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players", teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams", leagueId] });
      toast("Player added!", "success");
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const handleNextTeam = () => {
    if (!currentTeamValid) {
      toast(squadError ?? "Complete this team's squad first.", "error");
      return;
    }
    setTeamIndex((i) => i + 1);
  };

  const handleContinue = async () => {
    if (!teams || teams.length < 2) return;
    if (!currentTeamValid) {
      toast(squadError ?? "Complete this team's squad first.", "error");
      return;
    }
    for (const team of teams) {
      const squad = await playersApi.list(team.id);
      const error = validateTeamPlayers(squad);
      if (error) {
        toast(`${team.name}: ${error}`, "error");
        return;
      }
    }
    navigate(`/leagues/${leagueId}/setup/settings`);
  };

  if (teamsLoading) {
    return (
      <div className="mx-auto max-w-5xl p-6 md:p-8">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!teams || teams.length < 2) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
        <div>
          <p className="text-sm font-medium text-primary">Step 3 of 6</p>
          <h1 className="text-2xl font-bold">Add Players</h1>
        </div>
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          Add at least 2 teams before adding players.
        </p>
        <Button
          variant="outline"
          onClick={() => navigate(`/leagues/${leagueId}/setup/teams`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Add Teams
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Step 3 of 6</p>
          <h1 className="text-2xl font-bold">Add Players</h1>
          <p className="text-muted-foreground">
            Add players for each team one by one — 2+ players and exactly one
            goalkeeper per team
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/leagues/${leagueId}/setup/teams`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Add Teams
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="secondary">
          Team {teamIndex + 1} of {teams.length}
        </Badge>
        {teams.map((team, idx) => (
          <span
            key={team.id}
            className={
              idx === teamIndex ? "font-medium text-foreground" : undefined
            }
          >
            {team.name}
            {idx < teams.length - 1 ? " · " : ""}
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">{currentTeam?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add players for this team, then select a captain before moving on.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add Player</CardTitle>
            </CardHeader>
            <CardContent>
              <PlayerForm
                onSubmit={(data) => addPlayerMutation.mutate(data)}
                isSubmitting={addPlayerMutation.isPending}
                goalkeeperTaken={players?.some((p) => p.position === "GOALKEEPER")}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              Squad
              {players && (
                <Badge variant="secondary">{players.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {playersLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : players && players.length > 0 ? (
              <SquadPanel
                players={players}
                captainId={captainId}
                viceCaptainId={viceCaptainId}
                onCaptainChange={handleCaptainChange}
                onViceCaptainChange={handleViceChange}
                editableFields={false}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No players on this team yet.
              </p>
            )}
            {!currentTeamValid && squadError && (
              <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {squadError}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        {teamIndex > 0 && (
          <Button variant="outline" onClick={() => setTeamIndex((i) => i - 1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous Team
          </Button>
        )}
        <div className="flex-1" />
        {!isLastTeam ? (
          <Button
            onClick={handleNextTeam}
            disabled={!currentTeamValid || roleMutation.isPending}
          >
            Next Team
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleContinue}
            disabled={!currentTeamValid || roleMutation.isPending}
          >
            Continue to Settings
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
