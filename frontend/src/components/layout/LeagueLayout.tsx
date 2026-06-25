import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Home,
  Menu,
  Settings,
  Shield,
  Swords,
  Trophy,
} from "lucide-react";
import { leaguesApi } from "@/api/client";
import { useCanEdit } from "@/context/AppRoleContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "", label: "Dashboard", icon: Home, end: true },
  { to: "matches", label: "Matches", icon: Swords },
  { to: "teams", label: "Teams", icon: Shield },
  { to: "statistics", label: "Statistics", icon: BarChart3 },
  { to: "settings", label: "League Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const base = `/leagues/${id}`;

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ to, label, icon: Icon, end }) => {
        const href = to ? `${base}/${to}` : base;
        const active = end
          ? location.pathname === base
          : location.pathname.startsWith(href);
        return (
          <Link
            key={label}
            to={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function LeagueLayout() {
  const { id } = useParams<{ id: string }>();
  const leagueId = Number(id);
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const canEdit = useCanEdit();

  const { data: league, isLoading, isFetching } = useQuery({
    queryKey: ["league", leagueId],
    queryFn: () => leaguesApi.get(leagueId),
    enabled: !!leagueId,
  });

  useEffect(() => {
    if (league?.status === "DRAFT" && !isFetching && canEdit) {
      navigate(`/leagues/${leagueId}/setup/teams`, { replace: true });
    }
  }, [league, leagueId, navigate, isFetching, canEdit]);

  if (isLoading || league?.status === "DRAFT") {
    return (
      <div className="flex h-screen overflow-hidden">
        <Skeleton className="hidden w-64 shrink-0 md:block" />
        <div className="flex-1 p-4 md:p-8">
          <Skeleton className="mb-6 h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-border bg-card md:flex">
        <div className="shrink-0 border-b border-border p-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="font-semibold">Football League</span>
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">{league?.name}</p>
          <p className="text-xs text-muted-foreground">{league?.venue}</p>
          {league && (
            <Badge variant="secondary" className="mt-2">
              {league.status}
            </Badge>
          )}
          {!canEdit && (
            <Badge variant="outline" className="mt-2">
              View only
            </Badge>
          )}
        </div>
        <div className="flex-1 overflow-hidden p-4">
          <NavLinks />
        </div>
        <div className="shrink-0 border-t border-border p-4">
          <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/")}>
            Exit League
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-3 py-2.5 md:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(100vw-2rem,18rem)] p-0">
              <div className="border-b border-border p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">Football League</span>
                </div>
                <p className="mt-2 truncate text-sm font-medium">{league?.name}</p>
              </div>
              <div className="p-3">
                <NavLinks onNavigate={() => setMobileNavOpen(false)} />
              </div>
              <div className="border-t border-border p-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setMobileNavOpen(false);
                    navigate("/");
                  }}
                >
                  Exit League
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{league?.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {league?.venue}
              {!canEdit && " · View only"}
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
