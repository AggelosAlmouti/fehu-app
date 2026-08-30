"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toLocalISODate, todayISO } from "@/lib/data";
import { Sheet } from "@/components/sheet";
import { SheetHeader } from "@/components/sheet-header";

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
  const [viewMonth, setViewMonth] = useState(() => new Date(value));

  useEffect(() => {
    if (open) setViewMonth(new Date(value));
  }, [open, value]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay() is Sunday-first (0-6); shift to Monday-first for the grid.
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = todayISO();

  return (
    <Sheet open={open} onClose={onClose} ariaLabel="Choose date" maxWidth="max-w-sm">
      <SheetHeader title="Date" onClose={onClose} />

      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          aria-label="Previous month"
          className="flex size-8 items-center justify-center rounded-full text-detail transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="text-sm font-medium text-foreground">
          {viewMonth.toLocaleDateString("en-IE", { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          aria-label="Next month"
          className="flex size-8 items-center justify-center rounded-full text-detail transition-colors hover:text-foreground"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center text-xs text-muted">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const iso = toLocalISODate(new Date(year, month, day));
          const selected = iso === value;
          const isToday = iso === today;
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                onSelect(iso);
                onClose();
              }}
              aria-pressed={selected}
              className={`flex aspect-square items-center justify-center rounded-full text-sm transition-colors ${
                selected
                  ? "bg-accent text-background"
                  : isToday
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
