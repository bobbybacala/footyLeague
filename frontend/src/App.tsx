import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/toast";
import Home from "@/pages/Home";
import CreateLeague from "@/pages/CreateLeague";
import AddTeams from "@/pages/AddTeams";
import AddPlayers from "@/pages/AddPlayers";
import LeagueSettings from "@/pages/LeagueSettings";
import LeagueDashboard from "@/pages/LeagueDashboard";
import MatchPage from "@/pages/MatchPage";
import MatchDetails from "@/pages/MatchDetails";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/leagues/new" element={<CreateLeague />} />
            <Route path="/leagues/:id/teams" element={<AddTeams />} />
            <Route path="/leagues/:id/players" element={<AddPlayers />} />
            <Route path="/leagues/:id/settings" element={<LeagueSettings />} />
            <Route path="/leagues/:id" element={<LeagueDashboard />} />
            <Route path="/matches/:id" element={<MatchPage />} />
            <Route path="/matches/:id/details" element={<MatchDetails />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
