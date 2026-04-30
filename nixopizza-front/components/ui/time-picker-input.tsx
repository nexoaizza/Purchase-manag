"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";

interface TimePickerInputProps {
  /** Value in "YYYY-MM-DDTHH:mm" format (same as datetime-local) */
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0")
);

export function TimePickerInput({
  value,
  onChange,
  required,
}: TimePickerInputProps) {
  const [datePart = "", timePart = ""] = value ? value.split("T") : [];
  const [hourPart = "", minutePart = "00"] = timePart
    ? timePart.split(":")
    : [];

  const emit = (d: string, h: string, m: string) => {
    if (d) onChange(`${d}T${h || "00"}:${m || "00"}`);
  };

  return (
    <div className="flex gap-2 items-center">
      {/* Date picker */}
      <Input
        type="date"
        value={datePart}
        onChange={(e) => emit(e.target.value, hourPart, minutePart)}
        className="flex-1 min-w-0"
        required={required}
      />

      {/* Time picker — 24h, no AM/PM */}
      <div className="flex items-center gap-1 border rounded-md px-2 h-10 bg-background shrink-0">
        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />

        {/* Hours 00–23 */}
        <Select
          value={hourPart}
          onValueChange={(h) => emit(datePart, h, minutePart)}
        >
          <SelectTrigger className="border-0 shadow-none focus:ring-0 p-0 h-8 w-12">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent className="max-h-52 overflow-y-auto">
            {HOURS.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-muted-foreground font-semibold select-none">
          :
        </span>

        {/* Minutes 00–59 */}
        <Select
          value={minutePart}
          onValueChange={(m) => emit(datePart, hourPart, m)}
        >
          <SelectTrigger className="border-0 shadow-none focus:ring-0 p-0 h-8 w-12">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent className="max-h-52 overflow-y-auto">
            {MINUTES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
