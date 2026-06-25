import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface TeamFormValues {
  name: string;
  jersey_color: string;
}

interface TeamFormProps {
  onSubmit: (values: TeamFormValues) => void;
  isSubmitting?: boolean;
}

export function TeamForm({ onSubmit, isSubmitting }: TeamFormProps) {
  const [name, setName] = useState("");
  const [jerseyColor, setJerseyColor] = useState("#22c55e");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), jersey_color: jerseyColor });
    setName("");
    setJerseyColor("#22c55e");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="team-name">Team Name</Label>
        <Input
          id="team-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter team name"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="team-jersey" className="mb-0">
          Jersey Color
        </Label>
        <input
          id="team-jersey"
          type="color"
          value={jerseyColor}
          onChange={(e) => setJerseyColor(e.target.value)}
          className="color-swatch h-8 w-8 shrink-0 cursor-pointer rounded-md border border-border bg-transparent outline-none focus:outline-none focus:ring-0"
        />
      </div>
      <Button type="submit" disabled={isSubmitting || !name.trim()} className="w-full">
        Add Team
      </Button>
    </form>
  );
}
