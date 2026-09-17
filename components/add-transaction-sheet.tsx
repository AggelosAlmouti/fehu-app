"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import {
  relativeDay,
  todayISO,
  type Budget,
  type IncomeSource,
  type Transaction,
} from "@/lib/data";
import type { NewTransaction } from "@/lib/use-transactions";
import { AmountInput } from "@/components/amount-input";
import { DatePickerSheet } from "@/components/date-picker-sheet";
import { Sheet } from "@/components/sheet";
import { SheetHeader } from "@/components/sheet-header";

export function AddTransactionSheet({
  open,
  editing,
  budgets,
  budgetsLoading = false,
  sources,
  sourcesLoading = false,
  onClose,
  onAdd,
  onUpdate,
}: {
  open: boolean;
  /** Transaction being edited, or null when adding a new one. */
  editing: Transaction | null;
  /** Available budgets — shown as pills; required for an expense. */
  budgets: Budget[];
  budgetsLoading?: boolean;
  /** Available income sources — shown as pills; required for income. */
  sources: IncomeSource[];
  sourcesLoading?: boolean;
  onClose: () => void;
  onAdd: (transaction: NewTransaction) => void;
  onUpdate: (id: string, patch: NewTransaction) => void;
}) {
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [budgetId, setBudgetId] = useState<string | undefined>(undefined);
  const [sourceId, setSourceId] = useState<string | undefined>(undefined);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTxType(editing.type);
      setAmount(String(editing.amount));
      setTitle(editing.title);
      setDate(editing.date);
      setBudgetId(editing.type === "expense" ? editing.budgetId : undefined);
      setSourceId(editing.type === "income" ? editing.sourceId : undefined);
    } else {
      setTxType("expense");
      setAmount("");
      setTitle("");
      setDate(todayISO());
      setBudgetId(undefined);
      setSourceId(undefined);
    }
    const t = setTimeout(() => amountRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open, editing]);

  const parsed = Number.parseFloat(amount);
  const valid =
    Number.isFinite(parsed) &&
    parsed > 0 &&
    (txType !== "expense" || budgetId !== undefined) &&
    (txType !== "income" || sourceId !== undefined);

  const currentMonth = todayISO().slice(0, 7);
  const pickableBudgets = budgets.filter(
    (b) => b.cadence === "monthly" || b.month === currentMonth || b.id === budgetId,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    // Description is optional — "-" rather than a blank title.
    const finalTitle = title.trim() || "-";
    const payload: NewTransaction =
      txType === "expense"
        ? {
            type: "expense",
            title: finalTitle,
            amount: parsed,
            date,
            ...(budgetId ? { budgetId } : {}),
          }
        : {
            type: "income",
            title: finalTitle,
            amount: parsed,
            date,
            ...(sourceId ? { sourceId } : {}),
          };
    if (editing) onUpdate(editing.id, payload);
    else onAdd(payload);
    onClose();
  }

  const verb = editing ? "Edit" : "Add";
  const heading = `${verb} ${txType}`;

  const blockedOnNoBudgets =
    !editing && txType === "expense" && !budgetsLoading && pickableBudgets.length === 0;
  const blockedOnNoSources =
    !editing && txType === "income" && !sourcesLoading && sources.length === 0;
  const blocked = blockedOnNoBudgets || blockedOnNoSources;

  return (
    <>
      <Sheet open={open} onClose={onClose} ariaLabel={heading}>
        <SheetHeader title={heading} onClose={onClose} capitalize />

        <div className="flex flex-col gap-5">
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

          {blocked ? (
            <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-border bg-card px-4 py-6 text-center">
              <p className="text-sm text-detail">
                {blockedOnNoBudgets
                  ? "You need a budget before you can log an expense."
                  : "You need an income source before you can log income."}
              </p>
              <Link
                href={blockedOnNoBudgets ? "/budgets?add=1" : "/budgets?addSource=1"}
                onClick={onClose}
                className="rounded-full border border-accent/40 px-4 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
              >
                {blockedOnNoBudgets ? "Add a budget" : "Add an income source"}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <AmountInput value={amount} onChange={setAmount} inputRef={amountRef} />

              <button
                type="button"
                onClick={() => setDatePickerOpen(true)}
                className="flex w-fit items-center gap-1.5 rounded-full border border-accent/40 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
              >
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {relativeDay(date)}
              </button>

              <div>
                <label
                  htmlFor="transaction-title"
                  className="mb-1.5 block text-xs text-detail"
                >
                  Description (optional)
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
                  {budgetsLoading ? (
                    <p className="text-xs text-muted">Loading your budgets…</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {pickableBudgets.map((b) => {
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
                  )}
                </div>
              )}

              {txType === "income" && (
                <div>
                  <span className="mb-2 block text-xs text-detail">Source</span>
                  {sourcesLoading ? (
                    <p className="text-xs text-muted">Loading your income sources…</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {sources.map((s) => {
                        const active = s.id === sourceId
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSourceId(s.id)}
                            aria-pressed={active}
                            className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                              active
                                ? "border-accent bg-accent text-background"
                                : "border-border-strong text-detail hover:text-foreground"
                            }`}
                          >
                            {s.name}
                          </button>
                        )
                      })}
                    </div>
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
          )}
        </div>
      </Sheet>

      <DatePickerSheet
        open={datePickerOpen}
        value={date}
        onClose={() => setDatePickerOpen(false)}
        onSelect={setDate}
      />
    </>
  );
}
