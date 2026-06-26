import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
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
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center space-y-6 p-4 md:max-w-2xl md:p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>
      <div className="w-full max-w-lg text-center">
        <p className="text-sm font-medium text-primary">Step 6 of 6</p>
        <h1 className="text-xl font-bold md:text-2xl">League Ready</h1>
        <p className="mt-2 text-muted-foreground">
          Your league is set up and fixtures have been generated. Enter the dashboard to
          begin managing matches.
        </p>
      </div>
      <Card className="w-full max-w-lg">
        <CardContent className="p-5 text-center text-sm leading-relaxed text-muted-foreground md:p-6">
          Once the league starts, team structure is protected to keep standings and
          fixtures consistent.
        </CardContent>
      </Card>
      <Button size="lg" className="w-full max-w-lg" onClick={enterDashboard}>
        Enter Dashboard
      </Button>
    </div>
  );
}
