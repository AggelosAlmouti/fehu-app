export function Wordmark({
  className,
  hero = false,
}: {
  className?: string;
  hero?: boolean;
}) {
  return (
    <div className={`${hero ? "text-hero" : "text-body"} ${className ?? ""}`}>
      <img
        src="/icons/f-mark.png"
        alt=""
        className="mr-0.5 inline-block h-[1em] w-auto align-baseline"
        aria-hidden="true"
      />
      <span className="font-medium tracking-tight text-foreground">ehu</span>
    </div>
  );
}
