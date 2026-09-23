import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// The boxed "nothing here yet" for a whole empty page section.
export function EmptyState({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center card-box px-6 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-card">
        <Icon className="size-6 text-accent" aria-hidden="true" />
      </div>
      <p className="max-w-xs text-pretty text-caption">{children}</p>
    </div>
  );
}

// The inline "nothing here" line inside a list or sheet.
export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-caption">{children}</p>;
}
