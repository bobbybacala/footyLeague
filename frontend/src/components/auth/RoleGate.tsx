import { useState } from "react";
import { Eye, Loader2, Pencil, ShieldCheck, Trophy } from "lucide-react";
import { useAppRole } from "@/context/AppRoleContext";
import { getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Step = "choose" | "editor-key";

function RoleOptionCard({
  icon: Icon,
  title,
  description,
  variant = "default",
  disabled,
  onClick,
}: {
  icon: typeof Eye;
  title: string;
  description: string;
  variant?: "default" | "primary";
  disabled?: boolean;
  onClick: () => void;
}) {
  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col items-center rounded-xl border px-4 py-5 text-center transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-60",
        isPrimary
          ? "border-primary/40 bg-primary/10 hover:border-primary hover:bg-primary/15"
          : "border-border bg-secondary/30 hover:border-primary/40 hover:bg-secondary/50"
      )}
    >
      <div
        className={cn(
          "mb-3 flex h-11 w-11 items-center justify-center rounded-full transition-colors",
          isPrimary
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground group-hover:bg-primary/20 group-hover:text-primary"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-base font-semibold">{title}</span>
      <span className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

export function RoleGate({ children }: { children: React.ReactNode }) {
  const { role, isReady, loginAsViewer, loginAsEditor } = useAppRole();
  const [step, setStep] = useState<Step>("choose");
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const showModal = isReady && !role;

  const handleViewer = async () => {
    setError("");
    setLoading(true);
    try {
      await loginAsViewer();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEditorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey.trim()) {
      setError("Please enter the editor secret key.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await loginAsEditor(secretKey.trim());
      setSecretKey("");
      setStep("choose");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {children}
      <Dialog open={showModal} onOpenChange={() => {}}>
        <DialogContent
          hideClose
          className="z-[200] gap-0 overflow-hidden border-border/60 p-0 sm:max-w-[28rem]"
          overlayClassName="z-[200] bg-black/90 backdrop-blur-sm"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="border-b border-border/60 bg-gradient-to-b from-primary/10 to-transparent px-5 pb-5 pt-6 text-center sm:px-6 sm:pt-7">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/25">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            {step === "choose" ? (
              <>
                <DialogHeader className="space-y-2 text-center sm:text-center">
                  <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">
                    Welcome
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed">
                    How would you like to use Football League?
                  </DialogDescription>
                </DialogHeader>
              </>
            ) : (
              <>
                <DialogHeader className="space-y-2 text-center sm:text-center">
                  <DialogTitle className="flex items-center justify-center gap-2 text-xl font-bold">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Editor access
                  </DialogTitle>
                  <DialogDescription className="text-sm leading-relaxed">
                    Enter your secret key to unlock full access.
                  </DialogDescription>
                </DialogHeader>
              </>
            )}
          </div>

          <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
            {step === "choose" ? (
              <>
                {error && (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-center text-sm text-destructive">
                    {error}
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <RoleOptionCard
                    icon={Eye}
                    title="Viewer"
                    description="Browse leagues, standings, teams and match results."
                    disabled={loading}
                    onClick={handleViewer}
                  />
                  <RoleOptionCard
                    icon={Pencil}
                    title="Editor"
                    description="Create leagues, manage squads, score matches and more."
                    variant="primary"
                    disabled={loading}
                    onClick={() => {
                      setError("");
                      setStep("editor-key");
                    }}
                  />
                </div>
                {loading && (
                  <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing you in…
                  </p>
                )}
              </>
            ) : (
              <form onSubmit={handleEditorSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="editor-secret">Secret key</Label>
                  <Input
                    id="editor-secret"
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Enter secret key"
                    className="mt-1"
                    autoFocus
                    disabled={loading}
                  />
                </div>
                {error && (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={loading}
                    onClick={() => {
                      setStep("choose");
                      setSecretKey("");
                      setError("");
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="w-full sm:flex-1"
                    disabled={loading || !secretKey.trim()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      "Unlock editor"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
