"use client";

import type { RefObject } from "react";
import { currencyMap } from "@/lib/currencies";
import { useCurrency } from "@/lib/use-currency";

export function AmountInput({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const { currency } = useCurrency();
  return (
    <div className="flex justify-center">
      {/* Symbol sits outside the input so only the input gets centered. */}
      <div className="relative">
        <span className="pointer-events-none absolute right-full top-1/2 mr-1 -translate-y-1/2 whitespace-nowrap text-2xl font-medium text-detail">
          {currencyMap[currency].symbol}
        </span>
        <input
          ref={inputRef}
          inputMode="decimal"
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          aria-label="Amount"
          className="w-40 bg-transparent text-center text-4xl font-medium text-foreground outline-none placeholder:text-border-strong"
        />
      </div>
    </div>
  );
}
