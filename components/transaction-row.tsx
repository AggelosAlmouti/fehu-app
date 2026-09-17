"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatCurrency, relativeDay, type Transaction } from "@/lib/data";
import { useCurrency } from "@/lib/use-currency";

export function TransactionRow({
  transaction,
  isLast,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { currency } = useCurrency();
  return (
    <li className={`flex items-center gap-3 py-3 ${isLast ? "" : "border-b border-border"}`}>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-foreground">{transaction.title}</div>
        <div className="text-xs text-muted">{relativeDay(transaction.date)}</div>
      </div>
      <div
        className={`shrink-0 text-sm font-medium ${
          transaction.type === "income" ? "text-accent" : "text-foreground"
        }`}
      >
        {transaction.type === "income" ? "+" : "-"}
        {formatCurrency(transaction.amount, currency)}
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${transaction.title}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-detail transition-colors hover:text-foreground"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${transaction.title}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-detail transition-colors hover:text-danger"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}
