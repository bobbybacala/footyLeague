import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { leaguesApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LeagueFormat } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeagueSettings() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [format, setFormat] = useState<LeagueFormat>("SINGLE_ROUND_ROBIN");

  const { data: league, isLoading } = useQuery({
    queryKey: ["league", leagueId],
    queryFn: () => leaguesApi.get(leagueId),
    enabled: !!leagueId,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await leaguesApi.update(leagueId, { format });
      return leaguesApi.generateFixtures(leagueId);
    },
    onSuccess: () => {
      toast("Fixtures generated!", "success");
      navigate(`/leagues/${leagueId}`);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">League Settings</h1>
        <p className="text-muted-foreground">
          Configure format for {league?.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Competition Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-4 transition-colors has-[:checked]:border-primary">
            <input
              type="radio"
              name="format"
              value="SINGLE_ROUND_ROBIN"
              checked={format === "SINGLE_ROUND_ROBIN"}
              onChange={() => setFormat("SINGLE_ROUND_ROBIN")}
              className="mt-1 accent-primary"
            />
            <div>
              <p className="font-medium">Single Round Robin</p>
              <p className="text-sm text-muted-foreground">
                Each team plays every other team once
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-4 transition-colors has-[:checked]:border-primary">
            <input
              type="radio"
              name="format"
              value="DOUBLE_ROUND_ROBIN"
              checked={format === "DOUBLE_ROUND_ROBIN"}
              onChange={() => setFormat("DOUBLE_ROUND_ROBIN")}
              className="mt-1 accent-primary"
            />
            <div>
              <p className="font-medium">Double Round Robin (Home & Away)</p>
              <p className="text-sm text-muted-foreground">
                Each team plays every other team twice
              </p>
            </div>
          </label>

          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            Generate Fixtures & Go to Dashboard
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        onClick={() => navigate(`/leagues/${leagueId}/players`)}
      >
        Back
      </Button>
    </div>
  );
}
