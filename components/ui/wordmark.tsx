export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`text-body ${className}`}>
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
