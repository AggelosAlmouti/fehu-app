"use client";

import { useEffect, useRef, useState } from "react";
import type { Budget, Transaction } from "@/lib/data";
import type { NewTransaction } from "@/lib/use-transactions";
import { AmountInput } from "@/components/amount-input";
import { Sheet } from "@/components/sheet";
import { SheetHeader } from "@/components/sheet-header";

export function AddTransactionSheet({
  open,
  editing,
  budgets,
  onClose,
  onAdd,
  onUpdate,
}: {
  open: boolean;
  /** Transaction being edited, or null when adding a new one. */
  editing: Transaction | null;
  /** Available budgets — shown as pills; required for an expense. */
  budgets: Budget[];
  onClose: () => void;
  onAdd: (transaction: NewTransaction) => void;
  onUpdate: (id: string, patch: NewTransaction) => void;
}) {
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [budgetId, setBudgetId] = useState<string | undefined>(undefined);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTxType(editing.type);
      setAmount(String(editing.amount));
      setTitle(editing.title);
      setBudgetId(editing.type === "expense" ? editing.budgetId : undefined);
    } else {
      setTxType("expense");
      setAmount("");
      setTitle("");
      setBudgetId(undefined);
    }
    // Focus the amount field after the sheet animates in.
    const t = setTimeout(() => amountRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open, editing]);

  const parsed = Number.parseFloat(amount);
  const valid =
    title.trim().length > 0 &&
    Number.isFinite(parsed) &&
    parsed > 0 &&
    (txType !== "expense" || budgetId !== undefined);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const payload: NewTransaction =
      txType === "expense"
        ? {
            type: "expense",
            title: title.trim(),
            amount: parsed,
            ...(budgetId ? { budgetId } : {}),
          }
        : { type: "income", title: title.trim(), amount: parsed };
    if (editing) onUpdate(editing.id, payload);
    else onAdd(payload);
    onClose();
  }

  const verb = editing ? "Edit" : "Add";
  const heading = `${verb} ${txType}`;

  return (
    <Sheet open={open} onClose={onClose} ariaLabel={heading}>
      <SheetHeader title={heading} onClose={onClose} capitalize />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Type is fixed once a transaction exists. */}
        {!editing && (
          <div className="flex rounded-full border border-border-strong p-1">
            <button
              type="button"
              onClick={() => setTxType("expense")}
              aria-pressed={txType === "expense"}
              className={`flex-1 rounded-full py-1.5 text-xs font-medium transition-colors ${
                txType === "expense"
                  ? "bg-accent text-background"
                  : "text-detail"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setTxType("income")}
              aria-pressed={txType === "income"}
              className={`flex-1 rounded-full py-1.5 text-xs font-medium transition-colors ${
                txType === "income"
                  ? "bg-accent text-background"
                  : "text-detail"
              }`}
            >
              Income
            </button>
          </div>
        )}

        <AmountInput value={amount} onChange={setAmount} inputRef={amountRef} />

        <div>
          <label
            htmlFor="transaction-title"
            className="mb-1.5 block text-xs text-detail"
          >
            Description
          </label>
          <input
            id="transaction-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={txType === "expense" ? "e.g. Corner cafe" : "e.g. Salary"}
            className="w-full rounded-[var(--radius-card)] border border-border bg-card px-3.5 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-border-strong"
          />
        </div>

        {txType === "expense" && (
          <div>
            <span className="mb-2 block text-xs text-detail">Budget</span>
            {budgets.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {budgets.map((b) => {
                  const active = b.id === budgetId
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBudgetId(b.id)}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        active
                          ? "border-accent bg-accent text-background"
                          : "border-border-strong text-detail hover:text-foreground"
                      }`}
                    >
                      {b.name}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted">
                Add a budget first to log an expense.
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!valid}
          className="mt-1 w-full rounded-full bg-accent py-3.5 text-sm font-medium text-background transition-opacity disabled:opacity-40"
        >
          {editing ? "Save changes" : heading}
        </button>
      </form>
    </Sheet>
  );
}
