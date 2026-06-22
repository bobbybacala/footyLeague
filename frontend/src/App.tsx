import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";
import LeagueLayout from "@/components/layout/LeagueLayout";
import Home from "@/pages/Home";
import CreateLeague from "@/pages/CreateLeague";
import AddTeams from "@/pages/AddTeams";
import AddPlayers from "@/pages/AddPlayers";
import SetupSettings from "@/pages/SetupSettings";
import GenerateFixturesPage from "@/pages/GenerateFixturesPage";
import LeagueReadyPage from "@/pages/LeagueReadyPage";
import Dashboard from "@/pages/Dashboard";
import MatchesPage from "@/pages/MatchesPage";
import TeamsPage from "@/pages/TeamsPage";
import StatisticsPage from "@/pages/StatisticsPage";
import LeagueSettingsPage from "@/pages/LeagueSettingsPage";
import MatchPage from "@/pages/MatchPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function DashboardRoute() {
  const { id } = useParams<{ id: string }>();
  return <Dashboard leagueId={Number(id)} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/leagues/new" element={<CreateLeague />} />
              <Route path="/leagues/:id/setup/teams" element={<AddTeams />} />
              <Route path="/leagues/:id/setup/players" element={<AddPlayers />} />
              <Route path="/leagues/:id/setup/settings" element={<SetupSettings />} />
              <Route path="/leagues/:id/generate-fixtures" element={<GenerateFixturesPage />} />
              <Route path="/leagues/:id/ready" element={<LeagueReadyPage />} />
              <Route path="/leagues/:id" element={<LeagueLayout />}>
                <Route index element={<DashboardRoute />} />
                <Route path="matches" element={<MatchesPage />} />
                <Route path="teams" element={<TeamsPage />} />
                <Route path="statistics" element={<StatisticsPage />} />
                <Route path="settings" element={<LeagueSettingsPage />} />
              </Route>
              <Route path="/matches/:id" element={<MatchPage />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
