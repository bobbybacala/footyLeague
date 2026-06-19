import { useState } from "react";
import type { PlayerPosition } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const POSITIONS: { value: PlayerPosition; label: string }[] = [
  { value: "GOALKEEPER", label: "Goalkeeper" },
  { value: "DEFENDER", label: "Defender" },
  { value: "MIDFIELDER", label: "Midfielder" },
  { value: "FORWARD", label: "Forward" },
];

interface PlayerFormProps {
  onSubmit: (data: {
    name: string;
    position: PlayerPosition;
    is_captain: boolean;
  }) => void;
  isSubmitting?: boolean;
}

export function PlayerForm({ onSubmit, isSubmitting }: PlayerFormProps) {
  const [name, setName] = useState("");
  const [position, setPosition] = useState<PlayerPosition>("MIDFIELDER");
  const [isCaptain, setIsCaptain] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), position, is_captain: isCaptain });
    setName("");
    setIsCaptain(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="player-name">Player Name</Label>
        <Input
          id="player-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter player name"
        />
      </div>
      <div className="space-y-2">
        <Label>Position</Label>
        <Select
          value={position}
          onValueChange={(v) => setPosition(v as PlayerPosition)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POSITIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isCaptain}
          onChange={(e) => setIsCaptain(e.target.checked)}
          className="accent-primary"
        />
        Team Captain
      </label>
      <Button type="submit" disabled={isSubmitting || !name.trim()}>
        Add Player
      </Button>
    </form>
  );
}
