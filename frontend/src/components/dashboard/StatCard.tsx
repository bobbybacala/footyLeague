import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  isLoading?: boolean;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, isLoading, className }: StatCardProps) {
  if (isLoading) {
    return <Skeleton className={cn("h-28 rounded-xl", className)} />;
  }

  return (
    <Card className={cn("border-border/60 bg-card", className)}>
      <CardContent className="flex items-center gap-3 p-4 md:gap-4 md:p-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 md:h-12 md:w-12">
          <Icon className="h-5 w-5 text-primary md:h-6 md:w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground md:text-sm">{label}</p>
          <p className="text-2xl font-bold tracking-tight md:text-3xl">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
