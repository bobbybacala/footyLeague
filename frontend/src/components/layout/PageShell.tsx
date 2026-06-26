import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellMaxWidth = "7xl" | "5xl" | "4xl" | "2xl" | "lg";

interface PageShellProps {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: PageShellMaxWidth;
  headerClassName?: string;
  contentClassName?: string;
  /** layout = child of LeagueLayout outlet; standalone = full viewport pages */
  variant?: "layout" | "standalone";
}

const maxWidthClass: Record<PageShellMaxWidth, string> = {
  "7xl": "max-w-7xl",
  "5xl": "max-w-5xl",
  "4xl": "max-w-4xl",
  "2xl": "max-w-2xl",
  lg: "max-w-lg",
};

export function PageShell({
  header,
  children,
  footer,
  maxWidth = "7xl",
  headerClassName,
  contentClassName,
  variant = "layout",
}: PageShellProps) {
  const widthClass = maxWidthClass[maxWidth];

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col bg-background",
        variant === "layout" ? "h-full" : "min-h-screen overflow-hidden"
      )}
    >
      <div
        className={cn(
          "mx-auto w-full shrink-0 bg-background px-4 pb-4 pt-4 md:px-8 md:pb-5 md:pt-8",
          widthClass,
          headerClassName
        )}
      >
        {header}
      </div>

      <div className={cn("min-h-0 flex-1 overflow-y-auto", contentClassName)}>
        <div
          className={cn(
            "mx-auto w-full space-y-6 px-4 py-4 md:space-y-8 md:px-8 md:py-6",
            widthClass
          )}
        >
          {children}
        </div>
      </div>

      {footer}
    </div>
  );
}
