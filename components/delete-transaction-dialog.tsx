"use client";

import type { Transaction } from "@/lib/data";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeleteTransactionDialog({
  transaction,
  onCancel,
  onConfirm,
}: {
  transaction: Transaction | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={transaction !== null}
      title="Delete transaction"
      description={transaction ? `Delete "${transaction.title}"? This can't be undone.` : ""}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
