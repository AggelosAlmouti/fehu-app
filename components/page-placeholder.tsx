import type { LucideIcon } from "lucide-react"

export function PagePlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-32 pt-6 md:pt-10">
      <h1 className="mb-8 text-2xl font-medium tracking-tight md:mb-10">
        {title}
      </h1>
      <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-border bg-surface px-6 py-16 text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-card">
          <Icon className="size-6 text-accent" aria-hidden="true" />
        </div>
        <p className="max-w-xs text-pretty text-sm text-muted">{description}</p>
      </div>
    </div>
  )
}
