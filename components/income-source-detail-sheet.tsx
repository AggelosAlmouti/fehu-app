"use client";

import { useState } from "react";
import { formatCurrency, type IncomeSource, type Transaction } from "@/lib/data";
import { EmptyNote } from "@/components/empty-note";
import { DeleteTransactionDialog } from "@/components/delete-transaction-dialog";
import { Sheet } from "@/components/sheet";
import { SheetHeader } from "@/components/sheet-header";
import { TransactionRow } from "@/components/transaction-row";
import { useCurrency } from "@/lib/use-currency";

type IncomeTransaction = Extract<Transaction, { type: "income" }>;

export function IncomeSourceDetailSheet({
  source,
  transactions,
  onClose,
  onEdit,
  onDelete,
}: {
  source: IncomeSource | null;
  /** Already scoped to the right window by the caller. */
  transactions: IncomeTransaction[];
  onClose: () => void;
  onEdit: (transaction: IncomeTransaction) => void;
  onDelete: (id: string) => void;
}) {
  const { currency } = useCurrency();
  const [pendingDelete, setPendingDelete] = useState<IncomeTransaction | null>(
    null,
  );

  if (!source) return null;
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const earned = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <>
      <Sheet
        open={source !== null}
        onClose={onClose}
        ariaLabel={`${source.name} income`}
        scrollable
      >
        <SheetHeader title={source.name} onClose={onClose} />

        <div className="mb-4 text-right text-caption">
          {formatCurrency(earned, currency)} this month
        </div>

        {sorted.length > 0 ? (
          <ul className="flex flex-col overflow-y-auto">
            {sorted.map((t, i) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                isLast={i === sorted.length - 1}
                onEdit={() => onEdit(t)}
                onDelete={() => setPendingDelete(t)}
              />
            ))}
          </ul>
        ) : (
          <EmptyNote>No income this month.</EmptyNote>
        )}
      </Sheet>

      <DeleteTransactionDialog
        transaction={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </>
  );
}
