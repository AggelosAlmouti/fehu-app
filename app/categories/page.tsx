import { Tags } from "lucide-react"
import { PagePlaceholder } from "@/components/page-placeholder"

export default function CategoriesPage() {
  return (
    <PagePlaceholder
      title="Categories"
      description="Manage your expense categories and their icons here."
      icon={Tags}
    />
  )
}
