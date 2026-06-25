import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { leaguesApi, playersApi, teamsApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { PlayerForm } from "@/components/player-form/PlayerForm";
import { TeamForm } from "@/components/team-form/TeamForm";
import {
  SquadPanel,
  type SquadPlayerDraft,
} from "@/components/squad/SquadPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { validateTeamSquad } from "@/lib/teamValidation";
import { useCanEdit } from "@/context/AppRoleContext";
import type { PlayerPosition, Team } from "@/types";

function toDraft(player: { name: string; position: PlayerPosition }): SquadPlayerDraft {
  return { name: player.name, position: player.position };
}

function draftsEqual(a: SquadPlayerDraft, b: SquadPlayerDraft) {
  return a.name === b.name && a.position === b.position;
}

export default function TeamsPage() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [pendingTeam, setPendingTeam] = useState<Team | null>(null);
  const [drafts, setDrafts] = useState<Record<number, SquadPlayerDraft>>({});
  const [originals, setOriginals] = useState<Record<number, SquadPlayerDraft>>({});
  const [captainId, setCaptainId] = useState("");
  const [viceCaptainId, setViceCaptainId] = useState("");
  const [originalCaptainId, setOriginalCaptainId] = useState("");
  const [originalViceCaptainId, setOriginalViceCaptainId] = useState("");
  const [jerseyColorDraft, setJerseyColorDraft] = useState("#22c55e");
  const [originalJerseyColor, setOriginalJerseyColor] = useState("#22c55e");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [deletePlayerId, setDeletePlayerId] = useState<number | null>(null);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showAddTeamConfirm, setShowAddTeamConfirm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamJerseyColor, setNewTeamJerseyColor] = useState("#22c55e");
  const [showDeleteTeamConfirm, setShowDeleteTeamConfirm] = useState(false);
  const [showSwitchTeamConfirm, setShowSwitchTeamConfirm] = useState(false);
  const [showDiscardChangesConfirm, setShowDiscardChangesConfirm] = useState(false);

  const { data: league } = useQuery({
    queryKey: ["league", leagueId],
    queryFn: () => leaguesApi.get(leagueId),
  });

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams", leagueId],
    queryFn: () => teamsApi.list(leagueId),
  });

  const { data: teamPlayers, isLoading: playersLoading } = useQuery({
    queryKey: ["players", selectedTeam?.id],
    queryFn: () => playersApi.list(selectedTeam!.id),
    enabled: !!selectedTeam,
  });

  const isConcluded = league?.status === "COMPLETED";
  const canEdit = useCanEdit();
  const isReadOnly = isConcluded || !canEdit;

  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0]);
    }
  }, [teams, selectedTeam]);

  useEffect(() => {
    if (selectedTeam) {
      setJerseyColorDraft(selectedTeam.jersey_color || "#22c55e");
      setOriginalJerseyColor(selectedTeam.jersey_color || "#22c55e");
    }
  }, [selectedTeam]);

  useEffect(() => {
    if (teamPlayers) {
      const nextOriginals: Record<number, SquadPlayerDraft> = {};
      const nextDrafts: Record<number, SquadPlayerDraft> = {};
      let captain = "";
      let vice = "";
      for (const player of teamPlayers) {
        const draft = toDraft(player);
        nextOriginals[player.id] = draft;
        nextDrafts[player.id] = { ...draft };
        if (player.is_captain) captain = String(player.id);
        if (player.is_vice_captain) vice = String(player.id);
      }
      setOriginals(nextOriginals);
      setDrafts(nextDrafts);
      setCaptainId(captain);
      setViceCaptainId(vice);
      setOriginalCaptainId(captain);
      setOriginalViceCaptainId(vice);
    }
  }, [teamPlayers]);

  const playerIds = useMemo(
    () => (teamPlayers ?? []).map((p) => p.id),
    [teamPlayers]
  );

  const changedPlayerIds = useMemo(
    () =>
      playerIds.filter((pid) => {
        const orig = originals[pid];
        const draft = drafts[pid];
        return orig && draft && !draftsEqual(orig, draft);
      }),
    [drafts, originals, playerIds]
  );

  const captainChanged = captainId !== originalCaptainId;
  const viceChanged = viceCaptainId !== originalViceCaptainId;
  const jerseyChanged = jerseyColorDraft !== originalJerseyColor;
  const hasChanges =
    changedPlayerIds.length > 0 ||
    captainChanged ||
    viceChanged ||
    jerseyChanged;

  const squadError = validateTeamSquad(playerIds, drafts);

  const invalidateTeamData = () => {
    queryClient.invalidateQueries({ queryKey: ["teams", leagueId] });
    queryClient.invalidateQueries({ queryKey: ["players", selectedTeam?.id] });
    queryClient.invalidateQueries({ queryKey: ["league", leagueId] });
    queryClient.invalidateQueries({ queryKey: ["matches", leagueId] });
    queryClient.invalidateQueries({ queryKey: ["standings", leagueId] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const error = validateTeamSquad(playerIds, drafts);
      if (error) throw new Error(error);
      if (playerIds.length >= 2 && !captainId) {
        throw new Error("Please select a team captain.");
      }

      if (jerseyChanged && selectedTeam) {
        await teamsApi.updateJerseyColor(selectedTeam.id, jerseyColorDraft);
      }
      for (const playerId of changedPlayerIds) {
        const draft = drafts[playerId];
        await playersApi.update(playerId, {
          name: draft.name.trim(),
          position: draft.position,
        });
      }
      if (captainChanged || viceChanged) {
        for (const playerId of playerIds) {
          await playersApi.update(playerId, {
            is_captain: String(playerId) === captainId,
            is_vice_captain: String(playerId) === viceCaptainId,
          });
        }
      }

      return {
        jerseyColor: jerseyColorDraft,
        drafts: Object.fromEntries(
          playerIds.map((id) => {
            const draft = drafts[id];
            const saved =
              changedPlayerIds.includes(id)
                ? { name: draft.name.trim(), position: draft.position }
                : { ...draft };
            return [id, saved];
          })
        ),
        captainId,
        viceCaptainId,
      };
    },
    onSuccess: (snapshot) => {
      commitSavedChanges(snapshot);
      setDrafts(
        Object.fromEntries(
          Object.entries(snapshot.drafts).map(([id, draft]) => [id, { ...draft }])
        )
      );
      invalidateTeamData();
      toast("Changes saved!", "success");
      setShowSaveConfirm(false);
    },
    onError: (err) =>
      toast(err instanceof Error ? err.message : getErrorMessage(err), "error"),
  });

  const addTeamMutation = useMutation({
    mutationFn: ({ name, jersey_color }: { name: string; jersey_color: string }) =>
      teamsApi.create(leagueId, name, jersey_color),
    onSuccess: (team) => {
      invalidateTeamData();
      setSelectedTeam(team);
      setNewTeamName("");
      setShowAddTeamConfirm(false);
      toast("Team added and fixtures generated!", "success");
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: number) => teamsApi.delete(teamId),
    onSuccess: () => {
      invalidateTeamData();
      setSelectedTeam(null);
      setShowDeleteTeamConfirm(false);
      toast("Team deleted", "success");
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const addPlayerMutation = useMutation({
    mutationFn: (data: { name: string; position: PlayerPosition }) =>
      playersApi.create(selectedTeam!.id, { ...data, is_captain: false }),
    onSuccess: () => {
      invalidateTeamData();
      toast("Player added!", "success");
      setShowAddPlayerModal(false);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (playerId: number) => playersApi.delete(playerId),
    onSuccess: () => {
      invalidateTeamData();
      toast("Player removed", "success");
      setDeletePlayerId(null);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const revertChanges = () => {
    if (selectedTeam) {
      setJerseyColorDraft(originalJerseyColor);
    }
    setDrafts(
      Object.fromEntries(
        Object.entries(originals).map(([id, draft]) => [id, { ...draft }])
      )
    );
    setCaptainId(originalCaptainId);
    setViceCaptainId(originalViceCaptainId);
  };

  const commitSavedChanges = (snapshot: {
    jerseyColor: string;
    drafts: Record<number, SquadPlayerDraft>;
    captainId: string;
    viceCaptainId: string;
  }) => {
    setOriginalJerseyColor(snapshot.jerseyColor);
    setOriginals(
      Object.fromEntries(
        Object.entries(snapshot.drafts).map(([id, draft]) => [id, { ...draft }])
      )
    );
    setOriginalCaptainId(snapshot.captainId);
    setOriginalViceCaptainId(snapshot.viceCaptainId);
    setSelectedTeam((prev) =>
      prev ? { ...prev, jersey_color: snapshot.jerseyColor } : null
    );
  };

  const selectTeam = (team: Team) => {
    if (team.id === selectedTeam?.id) return;
    if (hasChanges) {
      setPendingTeam(team);
      setShowSwitchTeamConfirm(true);
      return;
    }
    setSelectedTeam(team);
  };

  const handleSaveClick = () => {
    const error = validateTeamSquad(playerIds, drafts);
    if (error) {
      toast(error, "error");
      return;
    }
    if (playerIds.length >= 2 && !captainId) {
      toast("Please select a team captain.", "error");
      return;
    }
    setShowSaveConfirm(true);
  };

  const playerToDelete = teamPlayers?.find((p) => p.id === deletePlayerId);

  return (
    <div className="mx-auto max-w-7xl space-y-6 md:space-y-8 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-3xl">Teams</h1>
          <p className="mt-1 text-muted-foreground">
            {isReadOnly
              ? "View teams and squads"
              : "Manage teams and players — 2+ players including exactly one goalkeeper"}
          </p>
        </div>
        {!isReadOnly && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
            {selectedTeam && hasChanges && (
              <>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setShowDiscardChangesConfirm(true)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Discard Changes
                </Button>
                <Button className="w-full sm:w-auto" onClick={handleSaveClick}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </>
            )}
            <div className="hidden md:block">
              <Button className="w-full sm:w-auto" onClick={() => setShowAddTeamModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add New team
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : teams && teams.length > 0 ? (
                <Select
                  value={selectedTeam ? String(selectedTeam.id) : undefined}
                  onValueChange={(value) => {
                    const team = teams.find((t) => String(t.id) === value);
                    if (team) selectTeam(team);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team" />
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
                <p className="text-sm text-muted-foreground">No teams yet.</p>
              )}
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full md:hidden"
                  onClick={() => setShowAddTeamModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add team
                </Button>
              )}
            </CardContent>
          </Card>

          {!isReadOnly && selectedTeam && (
            <>
              <Button
                type="button"
                className="w-full md:hidden"
                onClick={() => setShowAddPlayerModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Player to {selectedTeam.name}
              </Button>

              <Card className="hidden border-border/60 md:block">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Add Player to {selectedTeam.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <PlayerForm
                    onSubmit={(data) => addPlayerMutation.mutate(data)}
                    isSubmitting={addPlayerMutation.isPending}
                    goalkeeperTaken={playerIds.some(
                      (id) => drafts[id]?.position === "GOALKEEPER"
                    )}
                  />
                </CardContent>
              </Card>
            </>
          )}

        </div>

        <div className="space-y-4">
          {selectedTeam ? (
            <>
              {!isReadOnly && squadError && (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {squadError}
                </p>
              )}

              <Card className="border-border/60">
                <CardContent className="overflow-x-auto p-0 md:overflow-visible">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="w-auto min-w-[7rem] font-medium text-foreground md:w-44">
                          Team Name
                        </TableCell>
                        <TableCell className="break-words">{selectedTeam.name}</TableCell>
                      </TableRow>
                      <TableRow className="hover:bg-transparent">
                        <TableCell className="font-medium text-foreground md:pr-12">
                          Jersey Color
                        </TableCell>
                        <TableCell>
                          {isReadOnly ? (
                            <div
                              className="h-8 w-8 rounded-md border border-border"
                              style={{ backgroundColor: selectedTeam.jersey_color }}
                            />
                          ) : (
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                              <input
                                type="color"
                                value={jerseyColorDraft}
                                onChange={(e) => setJerseyColorDraft(e.target.value)}
                                className="color-swatch h-8 w-8 shrink-0 cursor-pointer rounded-md border border-border bg-transparent outline-none focus:outline-none focus:ring-0"
                              />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Squad</CardTitle>
                </CardHeader>
                <CardContent>
                  {playersLoading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : (
                    <SquadPanel
                      players={teamPlayers ?? []}
                      drafts={isReadOnly ? undefined : drafts}
                      captainId={captainId}
                      viceCaptainId={viceCaptainId}
                      onCaptainChange={setCaptainId}
                      onViceCaptainChange={setViceCaptainId}
                      readOnly={isReadOnly}
                      onDraftChange={(pid, patch) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [pid]: { ...prev[pid], ...patch },
                        }))
                      }
                      onDeletePlayer={
                        isReadOnly ? undefined : setDeletePlayerId
                      }
                      changedPlayerIds={changedPlayerIds}
                    />
                  )}
                </CardContent>
              </Card>

              {!isReadOnly && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setShowDeleteTeamConfirm(true)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete Team
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              Select a team to view the squad.
            </p>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Changes</DialogTitle>
            <DialogDescription>Save all changes to this team?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddTeamModal} onOpenChange={setShowAddTeamModal}>
        <DialogContent className="z-[200]" overlayClassName="z-[200]">
          <DialogHeader>
            <DialogTitle>Add Team</DialogTitle>
            <DialogDescription>
              Create a new team for this league. Fixtures will be updated automatically.
            </DialogDescription>
          </DialogHeader>
          <TeamForm
            onSubmit={(values) => {
              setNewTeamName(values.name);
              setNewTeamJerseyColor(values.jersey_color);
              setShowAddTeamModal(false);
              setShowAddTeamConfirm(true);
            }}
            isSubmitting={addTeamMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showAddPlayerModal} onOpenChange={setShowAddPlayerModal}>
        <DialogContent className="z-[200]" overlayClassName="z-[200]">
          <DialogHeader>
            <DialogTitle>Add Player to {selectedTeam?.name}</DialogTitle>
            <DialogDescription>
              Add a player to the selected team squad.
            </DialogDescription>
          </DialogHeader>
          {selectedTeam && (
            <PlayerForm
              onSubmit={(data) => addPlayerMutation.mutate(data)}
              isSubmitting={addPlayerMutation.isPending}
              goalkeeperTaken={playerIds.some(
                (id) => drafts[id]?.position === "GOALKEEPER"
              )}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAddTeamConfirm} onOpenChange={setShowAddTeamConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team</DialogTitle>
            <DialogDescription>
              Add {newTeamName} to the league? Fixtures will be generated automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTeamConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                addTeamMutation.mutate({
                  name: newTeamName,
                  jersey_color: newTeamJerseyColor,
                })
              }
              disabled={addTeamMutation.isPending}
            >
              Add Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteTeamConfirm} onOpenChange={setShowDeleteTeamConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Delete {selectedTeam?.name} and all associated matches?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteTeamConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedTeam && deleteTeamMutation.mutate(selectedTeam.id)}
              disabled={deleteTeamMutation.isPending}
            >
              Delete Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSwitchTeamConfirm} onOpenChange={setShowSwitchTeamConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Discard them and switch teams?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSwitchTeamConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                revertChanges();
                if (pendingTeam) setSelectedTeam(pendingTeam);
                setPendingTeam(null);
                setShowSwitchTeamConfirm(false);
                toast("Changes discarded", "success");
              }}
            >
              Discard & Switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDiscardChangesConfirm}
        onOpenChange={setShowDiscardChangesConfirm}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard Changes</DialogTitle>
            <DialogDescription>
              Revert all unsaved edits on this team? You can continue editing after
              discarding.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDiscardChangesConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                revertChanges();
                setShowDiscardChangesConfirm(false);
                toast("Changes discarded", "success");
              }}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletePlayerId} onOpenChange={(o) => !o && setDeletePlayerId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Player</DialogTitle>
            <DialogDescription>
              {playerToDelete?.has_match_history
                ? `${playerToDelete.name} has match history and cannot be deleted.`
                : `Delete ${playerToDelete?.name}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePlayerId(null)}>
              {playerToDelete?.has_match_history ? "Close" : "Cancel"}
            </Button>
            {!playerToDelete?.has_match_history && (
              <Button
                variant="destructive"
                onClick={() => deletePlayerId && deleteMutation.mutate(deletePlayerId)}
              >
                Delete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
