import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamsApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { TeamForm } from "@/components/team-form/TeamForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
    mutationFn: (name: string) => teamsApi.create(leagueId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams", leagueId] });
      toast("Team added!", "success");
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Add Teams</h1>
        <p className="text-muted-foreground">
          Add at least 2 teams to continue
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Team</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamForm
            onSubmit={(name) => mutation.mutate(name)}
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
                  className="rounded-md border border-border px-3 py-2"
                >
                  {team.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No teams added yet.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate("/")}>
          Home
        </Button>
        <Button
          onClick={() => navigate(`/leagues/${leagueId}/players`)}
          disabled={!teams || teams.length < 2}
        >
          Continue to Players
        </Button>
      </div>
    </div>
  );
}
