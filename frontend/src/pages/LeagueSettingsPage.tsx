import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leaguesApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useCanEdit } from "@/context/AppRoleContext";
import type { LeagueFormat } from "@/types";

function formatLabel(format: LeagueFormat): string {
  return format === "DOUBLE_ROUND_ROBIN"
    ? "Round Robin Twice (Home & Away)"
    : "Round Robin Once";
}

export default function LeagueSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const canEdit = useCanEdit();

  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showConcludeConfirm, setShowConcludeConfirm] = useState(false);

  const { data: league, isLoading } = useQuery({
    queryKey: ["league", leagueId],
    queryFn: () => leaguesApi.get(leagueId),
  });

  useEffect(() => {
    if (league) {
      setName(league.name);
      setVenue(league.venue);
    }
  }, [league]);

  const isConcluded = league?.status === "COMPLETED";
  const isDraft = league?.status === "DRAFT";

  const hasChanges =
    league &&
    canEdit &&
    !isConcluded &&
    (name.trim() !== league.name || venue.trim() !== league.venue);

  const saveMutation = useMutation({
    mutationFn: () =>
      leaguesApi.update(leagueId, {
        name: name.trim(),
        venue: venue.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["league", leagueId] });
      toast("Settings saved!", "success");
      setShowSaveConfirm(false);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const concludeMutation = useMutation({
    mutationFn: () => leaguesApi.conclude(leagueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["league", leagueId] });
      toast("League concluded", "success");
      setShowConcludeConfirm(false);
      navigate(`/leagues/${leagueId}`);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-64 w-full max-w-2xl rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 md:space-y-8 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-3xl">
            League Settings
          </h1>
          <p className="mt-1 text-muted-foreground">Competition configuration</p>
        </div>
        {hasChanges && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowDiscardConfirm(true)}>
              Discard Changes
            </Button>
            <Button onClick={() => setShowSaveConfirm(true)}>Save Changes</Button>
          </div>
        )}
      </div>

      {isConcluded && (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          This league is concluded. All data is read-only.
        </p>
      )}

      {!canEdit && !isConcluded && (
        <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          You are in viewer mode. Settings cannot be changed.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            League Details
            <Badge>{league?.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="league-name">League Name</Label>
            <Input
              id="league-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isConcluded || !canEdit}
            />
          </div>
          <div>
            <Label htmlFor="venue">Venue</Label>
            <Input
              id="venue"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              disabled={isConcluded || !canEdit}
            />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Format</p>
            <p className="font-medium">
              {league ? formatLabel(league.format) : "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Points System</p>
            <p className="font-medium">
              Win: {league?.points_win ?? 0} pts · Draw: {league?.points_draw ?? 0} pts
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tie Breakers</p>
            <p className="font-medium">Goal Difference → Goals For</p>
          </div>
        </CardContent>
      </Card>

      {!isConcluded && !isDraft && canEdit && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Conclude League</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mark the league as concluded. Matches and teams become read-only. Only
              completed matches will be visible.
            </p>
            <Button
              variant="destructive"
              onClick={() => setShowConcludeConfirm(true)}
            >
              Conclude League
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Settings</DialogTitle>
            <DialogDescription>Save league name and venue?</DialogDescription>
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

      <Dialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard Changes</DialogTitle>
            <DialogDescription>
              Revert league name and venue to the last saved values?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiscardConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (league) {
                  setName(league.name);
                  setVenue(league.venue);
                }
                setShowDiscardConfirm(false);
                toast("Changes discarded", "success");
              }}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConcludeConfirm} onOpenChange={setShowConcludeConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conclude League</DialogTitle>
            <DialogDescription>
              Are you sure? This will lock the league. No further edits to teams or
              matches will be allowed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConcludeConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => concludeMutation.mutate()}
              disabled={concludeMutation.isPending}
            >
              Conclude League
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
