"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/icon-button";
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
      <IconButton
        icon={ChevronLeft}
        label="Previous month"
        onClick={() => onChange(shiftMonthKey(month, -1))}
      />
      <span className="text-base font-medium text-foreground">{monthLabel(month)}</span>
      <IconButton
        icon={ChevronRight}
        label="Next month"
        onClick={() => onChange(shiftMonthKey(month, 1))}
      />
    </>
  );
}
