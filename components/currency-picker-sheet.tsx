"use client";

import { Check } from "lucide-react";
import { currencies, type CurrencyCode } from "@/lib/currencies";
import { Sheet } from "@/components/sheet";
import { SheetHeader } from "@/components/sheet-header";

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
    <Sheet open={open} onClose={onClose} ariaLabel="Choose currency" maxWidth="max-w-sm" scrollable>
      <SheetHeader title="Currency" onClose={onClose} />

      <ul className="flex flex-col overflow-y-auto">
        {currencies.map((c, i) => {
          const active = c.code === value;
          return (
            <li
              key={c.code}
              className={i === currencies.length - 1 ? "" : "border-b border-border"}
            >
              <button
                type="button"
                onClick={() => {
                  onSelect(c.code);
                  onClose();
                }}
                aria-pressed={active}
                className="flex w-full items-center justify-between gap-3 py-3 text-left"
              >
                <span className="text-sm text-foreground">
                  {c.label}
                  {/* "Other" renders as literal empty parens. */}
                  <span className="text-muted"> ({c.symbol})</span>
                </span>
                {active && (
                  <Check className="size-4 shrink-0 text-accent" aria-hidden="true" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
