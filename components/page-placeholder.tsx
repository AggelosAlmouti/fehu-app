import type { LucideIcon } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export function PagePlaceholder({
  title,
  description,
  icon,
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
      <EmptyState icon={icon}>{description}</EmptyState>
    </div>
  )
}
