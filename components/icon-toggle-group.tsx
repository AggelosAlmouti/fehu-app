import type { LucideIcon } from "lucide-react";

// Small icon-only view switcher (Dashboard budgets/income, Insights
// budget/date). Same control size as IconButton.
export function IconToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; icon: LucideIcon; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {options.map(({ value: optionValue, icon: Icon, label }) => {
        const active = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            aria-pressed={active}
            aria-label={label}
            className={`flex size-8 items-center justify-center rounded-full transition duration-150 active:scale-95 ${
              active
                ? "bg-accent text-background"
                : "text-detail hover:text-foreground"
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
