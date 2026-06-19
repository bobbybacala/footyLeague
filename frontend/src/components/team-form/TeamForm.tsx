import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TeamFormProps {
  onSubmit: (name: string) => void;
  isSubmitting?: boolean;
}

export function TeamForm({ onSubmit, isSubmitting }: TeamFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
    setName("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1 space-y-2">
        <Label htmlFor="team-name">Team Name</Label>
        <Input
          id="team-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter team name"
        />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          Add Team
        </Button>
      </div>
    </form>
  );
}
