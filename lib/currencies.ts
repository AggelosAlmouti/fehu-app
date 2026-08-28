// Major currencies with a hardcoded symbol (Intl/ICU doesn't render a
// clean glyph for all of them). "Other" is synthetic — blank symbol,
// bare numbers.

export type CurrencyCode = "USD" | "EUR" | "JPY" | "GBP" | "OTHER";

export type CurrencyOption = {
  code: CurrencyCode;
  label: string;
  /** Empty for "Other". */
  symbol: string;
};

export const currencies: CurrencyOption[] = [
  { code: "USD", label: "Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "OTHER", label: "Other", symbol: "" },
];

export const DEFAULT_CURRENCY: CurrencyCode = "EUR";

export const currencyMap: Record<CurrencyCode, CurrencyOption> =
  currencies.reduce(
    (acc, c) => {
      acc[c.code] = c;
      return acc;
    },
    {} as Record<CurrencyCode, CurrencyOption>,
  );

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && value in currencyMap;
}
