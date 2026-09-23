import type { ReactNode } from "react";

const tones = {
  neutral: "text-foreground",
  gain: "text-accent",
  loss: "text-danger",
};

// Gray label over a figure. Gold reads as a gain, red as a loss, white stays
// neutral — the one place that color rule lives.
export function Stat({
  label,
  tone = "neutral",
  size = "hero",
  className = "",
  children,
}: {
  label: string;
  tone?: keyof typeof tones;
  size?: "hero" | "strong";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-0.5 text-label">{label}</div>
      <div className={`${size === "hero" ? "text-hero" : "text-strong"} ${tones[tone]}`}>
        {children}
      </div>
    </div>
  );
}
