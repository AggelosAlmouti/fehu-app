import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

// The shared "nothing here yet" box: card, icon, instructional text.
export function EmptyState({
  icon: Icon,
  children,
}: {
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-border bg-surface px-6 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-card">
        <Icon className="size-6 text-accent" aria-hidden="true" />
      </div>
      <p className="max-w-xs text-pretty text-sm text-muted">{children}</p>
    </div>
  )
}
