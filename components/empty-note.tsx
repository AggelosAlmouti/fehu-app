import type { ReactNode } from "react";

// The inline "nothing here" line inside a list or sheet. (EmptyState is the
// full boxed version for a whole empty page section.)
export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-caption">{children}</p>;
}
