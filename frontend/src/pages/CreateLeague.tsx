import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { leaguesApi, getErrorMessage } from "@/api/client";
import { useLeagueStore } from "@/store/leagueStore";
import { useToast } from "@/components/ui/toast";
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
    <div className="mx-auto max-w-lg p-6 md:p-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">Step 1 of 6</p>
        <h1 className="text-2xl font-bold">Create League</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>League Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">League Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sunday League"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Pune Ground"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || !name.trim() || !venue.trim()}
              >
                Next
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
