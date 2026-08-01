import {
  LayoutDashboard,
  Wallet,
  ChartLine,
  Tags,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Budgets", href: "/budgets", icon: Wallet },
  { label: "Insights", href: "/insights", icon: ChartLine },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Settings", href: "/settings", icon: Settings },
]
