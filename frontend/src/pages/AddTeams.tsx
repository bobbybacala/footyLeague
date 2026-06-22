import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamsApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { TeamForm } from "@/components/team-form/TeamForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

export default function AddTeams() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams", leagueId],
    queryFn: () => teamsApi.list(leagueId),
    enabled: !!leagueId,
  });

  const mutation = useMutation({
    mutationFn: ({ name, jersey_color }: { name: string; jersey_color: string }) =>
      teamsApi.create(leagueId, name, jersey_color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", leagueId] });
      toast("Team added!", "success");
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 md:p-8">
      <div>
        <p className="text-sm font-medium text-primary">Step 2 of 6</p>
        <h1 className="text-2xl font-bold">Add Teams</h1>
        <p className="text-muted-foreground">Add at least 2 teams to continue</p>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        You must finish league setup before continuing. Back navigation is disabled.
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Team</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamForm
            onSubmit={(values) => mutation.mutate(values)}
            isSubmitting={mutation.isPending}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Teams{" "}
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
              {teams.map((team) => (
                <li
                  key={team.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                >
                  <span>{team.name}</span>
                  <div
                    className="h-6 w-6 rounded-full border border-border"
                    style={{ backgroundColor: team.jersey_color }}
                    title="Default jersey color"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No teams added yet.</p>
          )}
        </CardContent>
      </Card>

      <Button
        className="w-full"
        onClick={() => navigate(`/leagues/${leagueId}/setup/players`)}
        disabled={!teams || teams.length < 2}
      >
        Continue to Players
      </Button>
    </div>
  );
}
