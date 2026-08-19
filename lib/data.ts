import {
  Coffee,
  Bus,
  FileText,
  ShoppingBag,
  Home,
  Film,
  HeartPulse,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

export type CategoryId =
  | "food"
  | "transit"
  | "bills"
  | "shopping"
  | "home"
  | "fun"
  | "health"
  | "other";

export type Category = {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
};

export const categories: Category[] = [
  { id: "food", label: "Food", icon: Coffee },
  { id: "transit", label: "Transit", icon: Bus },
  { id: "bills", label: "Bills", icon: FileText },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "home", label: "Home", icon: Home },
  { id: "fun", label: "Fun", icon: Film },
  { id: "health", label: "Health", icon: HeartPulse },
  { id: "other", label: "Other", icon: MoreHorizontal },
];

export const categoryMap: Record<CategoryId, Category> = categories.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, Category>,
);

export type Expense = {
  id: string;
  title: string;
  category: CategoryId;
  amount: number;
  /** ISO date string */
  date: string;
  /** optional upcoming due note, e.g. "due in 2 days" */
  due?: string;
};

export function currentMonthLabel(): string {
  return new Date().toLocaleDateString("en-IE", {
    month: "long",
    year: "numeric",
  });
}

export const monthlyBudget = 2000;

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function relativeDay(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  const diff = Math.round(
    (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString("en-IE", { day: "numeric", month: "short" });
}
