"use client";

import { Check } from "lucide-react";
import { currencies, type CurrencyCode } from "@/lib/data";
import { RowList } from "@/components/ui/list-row";
import { Sheet } from "@/components/ui/sheet";

export function CurrencyPickerSheet({
  open,
  value,
  onClose,
  onSelect,
}: {
  open: boolean;
  value: CurrencyCode;
  onClose: () => void;
  onSelect: (code: CurrencyCode) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Currency" maxWidth="max-w-sm" scrollable>
      <RowList className="overflow-y-auto">
        {currencies.map((c) => (
          <li key={c.code}>
            <button
              type="button"
              onClick={() => {
                onSelect(c.code);
                onClose();
              }}
              aria-pressed={c.code === value}
              className="flex w-full items-center justify-between gap-3 py-3 text-left"
            >
              <span className="text-body text-foreground">
                {c.label}
                {c.symbol && <span className="text-caption"> ({c.symbol})</span>}
              </span>
              {c.code === value && (
                <Check className="size-4 shrink-0 text-accent" aria-hidden="true" />
              )}
            </button>
          </li>
        ))}
      </RowList>
    </Sheet>
  );
}
