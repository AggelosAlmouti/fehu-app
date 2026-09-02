export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={className}>
      <img
        src="/icons/f-mark.png"
        alt=""
        className="mr-0.5 inline-block h-[18px] w-auto align-baseline"
        aria-hidden="true"
      />
      <span className="text-lg font-medium tracking-tight text-foreground">
        ehu
      </span>
    </div>
  );
}
