"use client";

import { useState } from "react";
import {
  formatCurrency,
  relativeDay,
  sumAmounts,
  type Budget,
  type IncomeSource,
  type Transaction,
} from "@/lib/data";
import { useCurrency } from "@/lib/use-currency";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { EmptyNote } from "@/components/ui/empty-state";
import { ListRow, RowList } from "@/components/ui/list-row";
import { BudgetMeter } from "@/components/ui/meter";
import { Sheet } from "@/components/ui/sheet";

// Newest-first rows with edit/delete; owns the delete confirmation.
export function TransactionList({
  transactions,
  emptyText,
  scroll = false,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  emptyText: string;
  /** Scroll inside a height-capped sheet. */
  scroll?: boolean;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  const { currency } = useCurrency();
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      {sorted.length > 0 ? (
        <RowList className={scroll ? "overflow-y-auto" : ""}>
          {sorted.map((t) => (
            <ListRow
              key={t.id}
              title={t.title}
              subtitle={relativeDay(t.date)}
              value={`${t.type === "income" ? "+" : "-"}${formatCurrency(t.amount, currency)}`}
              gain={t.type === "income"}
              onEdit={() => onEdit(t)}
              onDelete={() => setPendingDelete(t)}
            />
          ))}
        </RowList>
      ) : (
        <EmptyNote>{emptyText}</EmptyNote>
      )}

      <ConfirmDeleteDialog
        noun="transaction"
        name={pendingDelete?.title ?? null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </>
  );
}

type DetailSheetProps = {
  /** Already scoped to the right window by the caller. */
  transactions: Transaction[];
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
};

export function BudgetDetailSheet({
  budget,
  singleMonth = true,
  ...list
}: DetailSheetProps & {
  budget: Budget | null;
  /** Spend is compared against the cap only when it covers a single month. */
  singleMonth?: boolean;
}) {
  const { currency } = useCurrency();
  if (!budget) return null;
  const spent = sumAmounts(list.transactions);

  return (
    <Sheet open onClose={list.onClose} title={budget.name} scrollable>
      {singleMonth ? (
        <div className="mb-4">
          <div className="mb-1.5 text-right text-caption">
            {formatCurrency(spent, currency)} / {formatCurrency(budget.amount, currency)}
          </div>
          <BudgetMeter spent={spent} limit={budget.amount} />
        </div>
      ) : (
        <div className="mb-4 text-right text-caption">
          {formatCurrency(spent, currency)} spent in this period
        </div>
      )}
      <TransactionList
        transactions={list.transactions}
        emptyText={singleMonth ? "No transactions this month." : "No transactions in this period."}
        scroll
        onEdit={list.onEdit}
        onDelete={list.onDelete}
      />
    </Sheet>
  );
}

export function IncomeSourceDetailSheet({
  source,
  ...list
}: DetailSheetProps & { source: IncomeSource | null }) {
  const { currency } = useCurrency();
  if (!source) return null;

  return (
    <Sheet open onClose={list.onClose} title={source.name} scrollable>
      <div className="mb-4 text-right text-caption">
        {formatCurrency(sumAmounts(list.transactions), currency)} this month
      </div>
      <TransactionList
        transactions={list.transactions}
        emptyText="No income this month."
        scroll
        onEdit={list.onEdit}
        onDelete={list.onDelete}
      />
    </Sheet>
  );
}
