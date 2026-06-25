import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { leaguesApi, getErrorMessage } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck } from "lucide-react";

export default function GenerateFixturesPage() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: preview, isLoading } = useQuery({
    queryKey: ["fixture-preview", leagueId],
    queryFn: () => leaguesApi.fixturePreview(leagueId),
    enabled: !!leagueId,
  });

  const mutation = useMutation({
    mutationFn: () => leaguesApi.generateFixtures(leagueId),
    onSuccess: (data) => {
      toast(`${data.fixture_count} fixtures generated!`, "success");
      navigate(`/leagues/${leagueId}/ready`);
    },
    onError: (err) => toast(getErrorMessage(err), "error"),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg p-4 md:p-6">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 md:p-8">
      <div>
        <p className="text-sm font-medium text-primary">Step 5 of 6</p>
        <h1 className="text-xl font-bold md:text-2xl">Generate Fixtures</h1>
        <p className="text-muted-foreground">Review and confirm fixture generation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Fixture Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-4xl font-bold text-primary md:text-5xl">
            {preview?.fixture_count ?? 0}
          </p>
          <p className="mt-2 text-muted-foreground">Fixtures will be generated</p>
        </CardContent>
      </Card>

      <Button
        className="w-full"
        size="lg"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !preview?.fixture_count}
      >
        Confirm & Generate Fixtures
      </Button>
    </div>
  );
}
