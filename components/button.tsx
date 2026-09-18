import type { ButtonHTMLAttributes } from "react";

// The app's one button recipe. Every text button (and link styled as one)
// goes through this so size, weight, border, hover and press behavior can't
// drift between screens — add a variant here rather than restyling inline.
export type ButtonVariant =
  | "solid"
  | "danger"
  | "outline"
  | "neutral"
  | "danger-outline"
  | "link";
export type ButtonSize = "inline" | "block";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-full text-base font-medium transition duration-150 active:scale-95 disabled:opacity-40";

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
