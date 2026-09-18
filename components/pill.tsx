import type { ButtonHTMLAttributes } from "react";

// Selection pill (Insights period filter, add-transaction budget/source
// picker). Both states carry the same border so a selected pill never
// changes size.
export function Pill({
  selected,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={`rounded-full border-2 px-3 py-1.5 text-base font-medium transition duration-150 active:scale-95 ${
        selected
          ? "border-accent bg-accent text-background"
          : "border-border-strong text-detail hover:text-foreground"
      } ${className}`}
      {...props}
    />
  );
}

// Two-or-more-option text switch inside one bordered track (expense/income).
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-full border-2 border-border-strong p-1">
      {options.map(({ value: optionValue, label }) => {
        const active = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            aria-pressed={active}
            className={`flex-1 rounded-full py-1.5 text-base font-medium transition duration-150 ${
              active ? "bg-accent text-background" : "text-detail"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
