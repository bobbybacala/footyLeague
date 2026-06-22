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
      <div className="space-y-2">
        <Label htmlFor="team-name">Team Name</Label>
        <Input
          id="team-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter team name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="team-jersey">Default Jersey Color</Label>
        <input
          id="team-jersey"
          type="color"
          value={jerseyColor}
          onChange={(e) => setJerseyColor(e.target.value)}
          className="h-10 w-full cursor-pointer rounded border border-border bg-transparent"
        />
      </div>
      <Button type="submit" disabled={isSubmitting || !name.trim()} className="w-full">
        Add Team
      </Button>
    </form>
  );
}
