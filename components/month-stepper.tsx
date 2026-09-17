"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel, shiftMonthKey } from "@/lib/data";

export function MonthStepper({
  month,
  onChange,
}: {
  month: string;
  onChange: (next: string) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onChange(shiftMonthKey(month, -1))}
        aria-label="Previous month"
        className="flex size-7 items-center justify-center rounded-full text-detail transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>
      <span className="text-sm font-medium text-foreground">{monthLabel(month)}</span>
      <button
        type="button"
        onClick={() => onChange(shiftMonthKey(month, 1))}
        aria-label="Next month"
        className="flex size-7 items-center justify-center rounded-full text-detail transition-colors hover:text-foreground"
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </>
  );
}
