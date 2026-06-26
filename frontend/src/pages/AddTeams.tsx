import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamsApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { PageShell } from "@/components/layout/PageShell";
import { TeamForm } from "@/components/team-form/TeamForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";
import type { Team } from "@/types";

export default function AddTeams() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [deleteTeamId, setDeleteTeamId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams", leagueId],
    queryFn: () => teamsApi.list(leagueId),
    enabled: !!leagueId,
  });

  const createMutation = useMutation({
    mutationFn: ({ name, jersey_color }: { name: string; jersey_color: string }) =>
      teamsApi.create(leagueId, name, jersey_color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", leagueId] });
      toast("Team added!", "success");
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const updateNameMutation = useMutation({
    mutationFn: ({ teamId, name }: { teamId: number; name: string }) =>
      teamsApi.update(teamId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", leagueId] });
      setEditingTeamId(null);
      toast("Team name updated", "success");
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const updateJerseyMutation = useMutation({
    mutationFn: ({ teamId, jersey_color }: { teamId: number; jersey_color: string }) =>
      teamsApi.updateJerseyColor(teamId, jersey_color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", leagueId] });
      toast("Jersey color updated", "success");
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (teamId: number) => teamsApi.delete(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", leagueId] });
      setDeleteTeamId(null);
      setEditingTeamId(null);
      toast("Team removed", "success");
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const teamToDelete = teams?.find((t) => t.id === deleteTeamId);

  const startEdit = (team: Team) => {
    setEditingTeamId(team.id);
    setDraftName(team.name);
  };

  const cancelEdit = () => {
    setEditingTeamId(null);
    setDraftName("");
  };

  const saveEdit = (team: Team) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    const trimmed = draftName.trim();
    if (!trimmed) {
      toast("Team name cannot be empty.", "error");
      return;
    }
    if (trimmed === team.name) {
      cancelEdit();
      return;
    }
    updateNameMutation.mutate({ teamId: team.id, name: trimmed });
  };

  const scheduleSave = (team: Team) => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    blurTimeoutRef.current = setTimeout(() => saveEdit(team), 150);
  };

  const cancelScheduledSave = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  };

  return (
    <>
      <PageShell
        variant="standalone"
        maxWidth="5xl"
        header={
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Step 2 of 6</p>
              <h1 className="text-xl font-bold md:text-2xl">Add Teams</h1>
              <p className="text-sm text-muted-foreground md:text-base">
                Add at least 2 teams to continue
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate(`/leagues/${leagueId}/setup/league`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Edit League Details
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Add all teams here, then continue to add players for each team. Click a team
        name to edit it, or use the color picker to change its jersey.
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>New Team</CardTitle>
          </CardHeader>
          <CardContent>
            <TeamForm
              onSubmit={(values) => createMutation.mutate(values)}
              isSubmitting={createMutation.isPending}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Teams Added{" "}
              {teams && (
                <Badge variant="secondary" className="ml-2">
                  {teams.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : teams && teams.length > 0 ? (
              <ul className="space-y-2">
                {teams.map((team) => {
                  const isEditing = editingTeamId === team.id;
                  return (
                    <li
                      key={team.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                    >
                      {isEditing ? (
                        <Input
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onFocus={cancelScheduledSave}
                          onBlur={() => scheduleSave(team)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              saveEdit(team);
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              cancelScheduledSave();
                              cancelEdit();
                            }
                          }}
                          autoFocus
                          disabled={updateNameMutation.isPending}
                          className="h-9 max-w-xs flex-1"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(team)}
                          className="min-w-0 flex-1 truncate text-left font-medium transition-colors hover:text-primary"
                        >
                          {team.name}
                        </button>
                      )}
                      <div className="flex shrink-0 items-center gap-2">
                        <input
                          type="color"
                          value={team.jersey_color}
                          onChange={(e) =>
                            updateJerseyMutation.mutate({
                              teamId: team.id,
                              jersey_color: e.target.value,
                            })
                          }
                          disabled={updateJerseyMutation.isPending}
                          className="color-swatch h-8 w-8 cursor-pointer rounded-md border border-border bg-transparent outline-none focus:outline-none focus:ring-0"
                          title="Change jersey color"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTeamId(team.id)}
                          title="Remove team"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No teams added yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          className="w-full px-8 sm:w-auto md:min-w-44"
          onClick={() => navigate(`/leagues/${leagueId}/setup/players`)}
          disabled={!teams || teams.length < 2}
        >
          Continue to Players
        </Button>
      </div>
      </PageShell>

      <Dialog open={!!deleteTeamId} onOpenChange={(o) => !o && setDeleteTeamId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team</DialogTitle>
            <DialogDescription>
              Remove {teamToDelete?.name} from the league? All players on this team will
              also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTeamId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTeamId && deleteMutation.mutate(deleteTeamId)}
              disabled={deleteMutation.isPending}
            >
              Remove Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
