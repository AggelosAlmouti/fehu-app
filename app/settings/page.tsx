import { Settings } from "lucide-react"
import { PagePlaceholder } from "@/components/page-placeholder"

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Settings"
      description="Currency, account and app preferences will live here."
      icon={Settings}
    />
  )
}
