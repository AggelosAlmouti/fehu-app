import { ChartLine } from "lucide-react"
import { PagePlaceholder } from "@/components/page-placeholder"

export default function InsightsPage() {
  return (
    <PagePlaceholder
      title="Insights"
      description="Trends and spending breakdowns across months will show up here."
      icon={ChartLine}
    />
  )
}
