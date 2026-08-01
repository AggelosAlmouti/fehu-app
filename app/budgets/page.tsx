import { Wallet } from "lucide-react"
import { PagePlaceholder } from "@/components/page-placeholder"

export default function BudgetsPage() {
  return (
    <PagePlaceholder
      title="Budgets"
      description="Set monthly limits per category and watch how close you are to each one."
      icon={Wallet}
    />
  )
}
