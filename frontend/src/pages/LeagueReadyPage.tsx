import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LeagueReadyPage() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const enterDashboard = async () => {
    await queryClient.invalidateQueries({ queryKey: ["league", leagueId] });
    await queryClient.refetchQueries({ queryKey: ["league", leagueId] });
    navigate(`/leagues/${leagueId}`);
  };

  return (
    <PageShell
      variant="standalone"
      maxWidth="2xl"
      headerClassName="text-center"
      header={
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <p className="mt-4 text-sm font-medium text-primary">Step 6 of 6</p>
          <h1 className="text-xl font-bold md:text-2xl">League Ready</h1>
          <p className="mt-2 text-muted-foreground">
            Your league is set up and fixtures have been generated. Enter the dashboard to
            begin managing matches.
          </p>
        </>
      }
    >
      <Card className="w-full">
        <CardContent className="p-5 text-center text-sm leading-relaxed text-muted-foreground md:p-6">
          Once the league starts, team structure is protected to keep standings and
          fixtures consistent.
        </CardContent>
      </Card>
      <Button size="lg" className="w-full" onClick={enterDashboard}>
        Enter Dashboard
      </Button>
    </PageShell>
  );
}
