"use client";

import type { RefObject } from "react";
import { currencyMap } from "@/lib/currencies";
import { useCurrency } from "@/lib/use-currency";

const MAX_AMOUNT = 999_999_999.99;

function groupThousands(raw: string): string {
  const [intPart, decPart] = raw.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${grouped}.${decPart}` : grouped;
}

function countDigits(s: string, upto: number): number {
  let n = 0;
  for (let i = 0; i < upto && i < s.length; i++) {
    if (/[0-9.]/.test(s[i])) n++;
  }
  return n;
}

function positionAfterDigits(formatted: string, n: number): number {
  if (n <= 0) return 0;
  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/[0-9.]/.test(formatted[i])) {
      count++;
      if (count === n) return i + 1;
    }
  }
  return formatted.length;
}

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
  const displayed = value ? groupThousands(value) : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const cursor = el.selectionStart ?? el.value.length;
    const digitsBeforeCursor = countDigits(el.value, cursor);

    const stripped = el.value.replace(/[^0-9.]/g, "");
    const firstDot = stripped.indexOf(".");
    const cleaned =
      firstDot === -1
        ? stripped
        : `${stripped.slice(0, firstDot)}.${stripped
            .slice(firstDot + 1)
            .replace(/\./g, "")
            .slice(0, 2)}`;

    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed) && parsed > MAX_AMOUNT) return;

    onChange(cleaned);

    const newFormatted = cleaned ? groupThousands(cleaned) : "";
    const pos = positionAfterDigits(newFormatted, digitsBeforeCursor);
    requestAnimationFrame(() => el.setSelectionRange(pos, pos));
  }

  function handleBlur() {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) onChange(parsed.toFixed(2));
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-2xl font-medium text-detail">
        {currencyMap[currency].symbol}
      </span>
      <div className="flex justify-center">
        <input
          ref={inputRef}
          inputMode="decimal"
          placeholder="0.00"
          value={displayed}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-label="Amount"
          className="w-[11ch] max-w-full bg-transparent text-center text-4xl font-medium text-foreground outline-none placeholder:text-border-strong"
        />
      </div>
    </div>
  );
}
