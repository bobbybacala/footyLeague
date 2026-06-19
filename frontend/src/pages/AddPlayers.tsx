import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { playersApi, teamsApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
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
import type { PlayerPosition } from "@/types";

export default function AddPlayers() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

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

  const mutation = useMutation({
    mutationFn: (data: {
      name: string;
      position: PlayerPosition;
      is_captain: boolean;
    }) => playersApi.create(teamId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players", teamId] });
      toast("Player added!", "success");
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Add Players</h1>
        <p className="text-muted-foreground">
          Add players to each team before configuring the league
        </p>
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
              <ul className="space-y-2">
                {players.map((player) => (
                  <li
                    key={player.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span>
                      {player.name}
                      {player.is_captain && (
                        <Badge className="ml-2" variant="outline">
                          C
                        </Badge>
                      )}
                    </span>
                    <span className="text-muted-foreground">
                      {player.position.replace("_", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No players on this team yet.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => navigate(`/leagues/${leagueId}/teams`)}
        >
          Back
        </Button>
        <Button
          onClick={() => navigate(`/leagues/${leagueId}/settings`)}
          disabled={!teams || teams.length < 2}
        >
          Continue to Settings
        </Button>
      </div>
    </div>
  );
}
