import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leaguesApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function SetupLeagueDetails() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");

  const { data: league, isLoading } = useQuery({
    queryKey: ["league", leagueId],
    queryFn: () => leaguesApi.get(leagueId),
    enabled: !!leagueId,
  });

  useEffect(() => {
    if (league) {
      setName(league.name);
      setVenue(league.venue);
    }
  }, [league]);

  const mutation = useMutation({
    mutationFn: () =>
      leaguesApi.update(leagueId, { name: name.trim(), venue: venue.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["league", leagueId] });
      toast("League details saved!", "success");
      navigate(`/leagues/${leagueId}/setup/teams`);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !venue.trim()) return;
    mutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg p-4 md:p-8">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <PageShell
      variant="standalone"
      maxWidth="lg"
      header={
        <>
          <p className="text-sm font-medium text-primary">Step 1 of 6</p>
          <h1 className="text-xl font-bold md:text-2xl">League Details</h1>
          <p className="text-muted-foreground">Edit your league name and venue</p>
        </>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>League Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">League Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sunday League"
              />
            </div>
            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Pune Ground"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending || !name.trim() || !venue.trim()}
            >
              Save & Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
