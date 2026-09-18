"use client";

import { Pencil, Trash2 } from "lucide-react";
import { IconButton } from "@/components/icon-button";
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
    <li className={`flex items-center gap-3 py-3 ${isLast ? "" : "border-b-2 border-border"}`}>
      <div className="min-w-0 flex-1">
        <div className="truncate text-base text-foreground">{transaction.title}</div>
        <div className="text-caption">{relativeDay(transaction.date)}</div>
      </div>
      <div
        className={`shrink-0 text-base font-medium ${
          transaction.type === "income" ? "text-accent" : "text-foreground"
        }`}
      >
        {transaction.type === "income" ? "+" : "-"}
        {formatCurrency(transaction.amount, currency)}
      </div>
      <IconButton icon={Pencil} label={`Edit ${transaction.title}`} onClick={onEdit} />
      <IconButton
        icon={Trash2}
        tone="danger"
        label={`Delete ${transaction.title}`}
        onClick={onDelete}
      />
    </li>
  );
}
