"use client";

import { useEffect, useState } from "react";
import { toLocalISODate, todayISO } from "@/lib/data";
import { MonthStepper } from "@/components/ui/month-stepper";
import { Sheet } from "@/components/ui/sheet";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function DatePickerSheet({
  open,
  value,
  onClose,
  onSelect,
}: {
  open: boolean;
  /** ISO date string of the currently selected day. */
  value: string;
  onClose: () => void;
  onSelect: (iso: string) => void;
}) {
  // "YYYY-MM" — sliced from the ISO string, never parsed through Date, which
  // reads it as UTC and can land on the previous month in some timezones.
  const [viewMonth, setViewMonth] = useState(() => value.slice(0, 7));

  useEffect(() => {
    if (open) setViewMonth(value.slice(0, 7));
  }, [open, value]);

  const [year, month] = viewMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  // getDay() is Sunday-first (0-6); shift to Monday-first for the grid.
  const leadingBlanks = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = todayISO();

  return (
    <Sheet open={open} onClose={onClose} title="Date" maxWidth="max-w-sm">
      <div className="mb-3 flex items-center justify-between">
        <MonthStepper month={viewMonth} onChange={setViewMonth} />
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center text-caption">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const iso = toLocalISODate(new Date(year, month - 1, day));
          const selected = iso === value;
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                onSelect(iso);
                onClose();
              }}
              aria-pressed={selected}
              className={`flex aspect-square items-center justify-center rounded-full text-body transition-colors ${
                selected
                  ? "bg-accent text-background"
                  : iso === today
                    ? "text-accent"
                    : "text-foreground hover:bg-card"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
