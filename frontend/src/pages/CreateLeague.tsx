import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { leaguesApi, getErrorMessage } from "@/api/client";
import { useLeagueStore } from "@/store/leagueStore";
import { useToast } from "@/components/ui/toast";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateLeague() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const setCurrentLeagueId = useLeagueStore((s) => s.setCurrentLeagueId);
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");

  const mutation = useMutation({
    mutationFn: () => leaguesApi.create({ name, venue }),
    onSuccess: (league) => {
      setCurrentLeagueId(league.id);
      toast("League created successfully!", "success");
      navigate(`/leagues/${league.id}/setup/teams`);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !venue.trim()) return;
    mutation.mutate();
  };

  return (
    <PageShell
      variant="standalone"
      maxWidth="lg"
      header={
        <>
          <p className="text-sm font-medium text-primary">Step 1 of 6</p>
          <h1 className="text-xl font-bold md:text-2xl">Create League</h1>
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
            <div className="flex flex-col gap-2 md:flex-row">
              <Button type="button" variant="outline" className="w-full md:w-auto" onClick={() => navigate("/")}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={mutation.isPending || !name.trim() || !venue.trim()}
              >
                Next
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageShell>
  );
}
