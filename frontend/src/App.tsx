import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";
import { AppRoleProvider } from "@/context/AppRoleContext";
import { RoleGate } from "@/components/auth/RoleGate";
import { ProtectedEditorRoute } from "@/components/auth/ProtectedEditorRoute";
import { ApiLoadingOverlay } from "@/components/ui/api-loading-overlay";
import LeagueLayout from "@/components/layout/LeagueLayout";
import Home from "@/pages/Home";
import CreateLeague from "@/pages/CreateLeague";
import SetupLeagueDetails from "@/pages/SetupLeagueDetails";
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
          <AppRoleProvider>
            <RoleGate>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route
                    path="/leagues/new"
                    element={
                      <ProtectedEditorRoute>
                        <CreateLeague />
                      </ProtectedEditorRoute>
                    }
                  />
                  <Route
                    path="/leagues/:id/setup/league"
                    element={
                      <ProtectedEditorRoute>
                        <SetupLeagueDetails />
                      </ProtectedEditorRoute>
                    }
                  />
                  <Route
                    path="/leagues/:id/setup/teams"
                    element={
                      <ProtectedEditorRoute>
                        <AddTeams />
                      </ProtectedEditorRoute>
                    }
                  />
                  <Route
                    path="/leagues/:id/setup/players"
                    element={
                      <ProtectedEditorRoute>
                        <AddPlayers />
                      </ProtectedEditorRoute>
                    }
                  />
                  <Route
                    path="/leagues/:id/setup/settings"
                    element={
                      <ProtectedEditorRoute>
                        <SetupSettings />
                      </ProtectedEditorRoute>
                    }
                  />
                  <Route
                    path="/leagues/:id/generate-fixtures"
                    element={
                      <ProtectedEditorRoute>
                        <GenerateFixturesPage />
                      </ProtectedEditorRoute>
                    }
                  />
                  <Route
                    path="/leagues/:id/ready"
                    element={
                      <ProtectedEditorRoute>
                        <LeagueReadyPage />
                      </ProtectedEditorRoute>
                    }
                  />
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
            </RoleGate>
          </AppRoleProvider>
        </ToastProvider>
      </TooltipProvider>
      <ApiLoadingOverlay />
      <Analytics />
    </QueryClientProvider>
  );
}
