import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { playersApi, teamsApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { validateTeamSquad } from "@/lib/teamValidation";
import { SquadPanel } from "@/components/squad/SquadPanel";
import { PlayerForm } from "@/components/player-form/PlayerForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import type { PlayerPosition } from "@/types";

export default function AddPlayers() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const [captainId, setCaptainId] = useState("");
  const [viceCaptainId, setViceCaptainId] = useState("");

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["teams", leagueId],
    queryFn: () => teamsApi.list(leagueId),
    enabled: !!leagueId,
  });

  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(String(teams[0].id));
    }
  }, [teams, selectedTeamId]);

  const teamId = selectedTeamId ? Number(selectedTeamId) : teams?.[0]?.id;

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
    }
  }, [players, teamId]);

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

  const mutation = useMutation({
    mutationFn: (data: { name: string; position: PlayerPosition }) =>
      playersApi.create(teamId!, { ...data, is_captain: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players", teamId] });
      queryClient.invalidateQueries({ queryKey: ["teams", leagueId] });
      toast("Player added!", "success");
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const handleContinue = async () => {
    if (!teams || teams.length < 2) return;
    for (const team of teams) {
      const squad = await playersApi.list(team.id);
      const drafts = Object.fromEntries(
        squad.map((p) => [p.id, { name: p.name, position: p.position }])
      );
      const error = validateTeamSquad(
        squad.map((p) => p.id),
        drafts
      );
      if (error) {
        toast(`${team.name}: ${error}`, "error");
        return;
      }
      if (!squad.some((p) => p.is_captain)) {
        toast(`${team.name}: Please select a captain.`, "error");
        return;
      }
    }
    navigate(`/leagues/${leagueId}/setup/settings`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 md:p-8">
      <div>
        <p className="text-sm font-medium text-primary">Step 3 of 6</p>
        <h1 className="text-2xl font-bold">Add Players</h1>
        <p className="text-muted-foreground">
          Add at least 2 players per team, including exactly one goalkeeper
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        League setup is currently in progress. You cannot return to previous steps.
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Team</CardTitle>
        </CardHeader>
        <CardContent>
          {teamsLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : teams && teams.length > 0 ? (
            <Select
              value={selectedTeamId || String(teams[0].id)}
              onValueChange={setSelectedTeamId}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={String(team.id)}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              Add teams first before adding players.
            </p>
          )}
        </CardContent>
      </Card>

      {teamId && (
        <Card>
          <CardHeader>
            <CardTitle>Add Player</CardTitle>
          </CardHeader>
          <CardContent>
            <PlayerForm
              onSubmit={(data) => mutation.mutate(data)}
              isSubmitting={mutation.isPending}
              goalkeeperTaken={players?.some((p) => p.position === "GOALKEEPER")}
            />
          </CardContent>
        </Card>
      )}

      {teamId && (
        <Card>
          <CardHeader>
            <CardTitle>
              Squad{" "}
              {players && (
                <Badge variant="secondary" className="ml-2">
                  {players.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {playersLoading ? (
              <Skeleton className="h-20 w-full" />
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
          </CardContent>
        </Card>
      )}

      <Button
        className="w-full"
        onClick={handleContinue}
        disabled={!teams || teams.length < 2}
      >
        Continue to Settings
      </Button>
    </div>
  );
}
