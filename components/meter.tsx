// The app's one progress/comparison bar (budget cards, budget detail sheet,
// Insights' ranked rows). Height and animation live here only.
export function Meter({
  percent,
  tone = "accent",
  className = "",
}: {
  percent: number;
  tone?: "accent" | "danger";
  className?: string;
}) {
  return (
    <div className={`h-1.25 overflow-hidden rounded-full bg-border ${className}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${
          tone === "danger" ? "bg-danger" : "bg-accent"
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
