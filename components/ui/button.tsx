import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

// Every pressable control in the app lives here, so size, weight, border,
// hover, press and disabled behavior can't drift between screens. Add a
// variant here rather than restyling a button inline.

type ButtonVariant =
  | "solid"
  | "danger"
  | "outline"
  | "neutral"
  | "danger-outline"
  | "link";
type ButtonSize = "inline" | "block";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-full text-strong press disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  solid: "border-2 border-accent bg-accent text-background hover:opacity-90",
  danger: "border-2 border-danger bg-danger text-background hover:opacity-90",
  outline: "border-2 border-accent/40 text-accent hover:bg-accent/10",
  neutral: "border-2 border-border-strong text-foreground hover:bg-card",
  "danger-outline":
    "border-2 border-border-strong text-danger hover:bg-danger/10",
  link: "text-detail hover:text-foreground",
};

const sizes: Record<ButtonSize, string> = {
  inline: "px-3.5 py-2",
  block: "w-full py-3.5",
};

/** For links styled as buttons. */
export function buttonClass({
  variant = "neutral",
  size = "inline",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, className })}
      {...props}
    />
  );
}

// Icon-only button: standard control size, a larger one for the mobile menu
// and desktop add button, and the mobile FAB. `pressed` makes it a toggle.
const iconSizes = {
  md: { box: "size-8", icon: "size-4" },
  lg: { box: "size-10", icon: "size-6" },
  fab: { box: "size-14", icon: "size-6" },
};

const iconTones = {
  neutral: "text-detail hover:text-foreground",
  danger: "text-detail hover:text-danger",
  solid: "bg-accent text-background hover:opacity-90",
};

export function IconButton({
  icon: Icon,
  label,
  tone = "neutral",
  size = "md",
  pressed,
  className = "",
  type = "button",
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  icon: LucideIcon;
  label: string;
  tone?: keyof typeof iconTones;
  size?: keyof typeof iconSizes;
  pressed?: boolean;
}) {
  return (
    <button
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      className={`flex ${iconSizes[size].box} shrink-0 items-center justify-center rounded-full press ${
        pressed ? "bg-accent text-background" : iconTones[tone]
      } ${className}`}
      {...props}
    >
      <Icon className={iconSizes[size].icon} aria-hidden="true" />
    </button>
  );
}

// Small icon-only view switcher (Dashboard budgets/income, Insights budget/date).
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
      {options.map((option) => (
        <IconButton
          key={option.value}
          icon={option.icon}
          label={option.label}
          pressed={option.value === value}
          onClick={() => onChange(option.value)}
        />
      ))}
    </div>
  );
}

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
      className={`rounded-full border-2 px-3 py-1.5 text-strong press ${
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
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={option.value === value}
          className={`flex-1 rounded-full py-1.5 text-strong press ${
            option.value === value ? "bg-accent text-background" : "text-detail"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// A whole card that opens something (budget/income cards, ranked rows).
export function CardButton({
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`card-box press text-left hover:bg-card ${className}`}
      {...props}
    />
  );
}

// On/off switch with its label beside it.
export function Switch({
  checked,
  onChange,
  label,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name. */
  label: string;
  /** Visible text beside the switch. */
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-border-strong"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-foreground transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      <span className="text-body text-foreground">{children}</span>
    </div>
  );
}

// A link inside running text.
export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-medium text-foreground underline decoration-border-strong decoration-2 underline-offset-4 transition-colors hover:decoration-foreground"
    >
      {children}
    </Link>
  );
}
