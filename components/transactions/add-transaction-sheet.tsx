"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import {
  isBudgetActive,
  relativeDay,
  todayISO,
  type Budget,
  type IncomeSource,
  type NewTransaction,
  type Transaction,
} from "@/lib/data";
import { Button, Pill, SegmentedControl, buttonClass } from "@/components/ui/button";
import { AmountInput } from "@/components/ui/amount-input";
import { DatePickerSheet } from "@/components/transactions/date-picker-sheet";
import { Field } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";

// A labelled row of pills to pick one budget or income source.
function PillPicker({
  label,
  loading,
  loadingText,
  options,
  selectedId,
  onSelect,
}: {
  label: string;
  loading: boolean;
  loadingText: string;
  options: { id: string; name: string }[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-label">{label}</span>
      {loading ? (
        <p className="text-caption">{loadingText}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <Pill
              key={o.id}
              selected={o.id === selectedId}
              onClick={() => onSelect(o.id)}
            >
              {o.name}
            </Pill>
          ))}
        </div>
      )}
    </div>
  );
}

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
  /** Omit for edit-only callers. */
  onAdd?: (transaction: NewTransaction) => void;
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
  }, [open, editing]);

  const parsed = Number.parseFloat(amount);
  const valid =
    Number.isFinite(parsed) &&
    parsed > 0 &&
    (txType !== "expense" || budgetId !== undefined) &&
    (txType !== "income" || sourceId !== undefined);

  const pickableBudgets = budgets.filter((b) => isBudgetActive(b) || b.id === budgetId);

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
    else onAdd?.(payload);
    onClose();
  }

  const heading = `${editing ? "Edit" : "Add"} ${txType}`;

  const blockedOnNoBudgets =
    !editing && txType === "expense" && !budgetsLoading && pickableBudgets.length === 0;
  const blockedOnNoSources =
    !editing && txType === "income" && !sourcesLoading && sources.length === 0;
  const blocked = blockedOnNoBudgets || blockedOnNoSources;

  return (
    <>
      <Sheet open={open} onClose={onClose} title={heading} initialFocus={amountRef}>
        <div className="flex flex-col gap-5">
          {!editing && (
            <SegmentedControl
              value={txType}
              onChange={setTxType}
              options={[
                { value: "expense", label: "Expense" },
                { value: "income", label: "Income" },
              ]}
            />
          )}

          {blocked ? (
            <div className="flex flex-col items-center gap-3 card-box px-4 py-6 text-center">
              <p className="text-caption">
                {blockedOnNoBudgets
                  ? "You need a budget before you can log an expense."
                  : "You need an income, like Salary, before you can log money coming in."}
              </p>
              <Link
                href={blockedOnNoBudgets ? "/budgets?add=1" : "/budgets?addSource=1"}
                onClick={onClose}
                className={buttonClass({ variant: "outline" })}
              >
                {blockedOnNoBudgets ? "Add a budget" : "Add an income"}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <AmountInput value={amount} onChange={setAmount} inputRef={amountRef} />

              <Button
                variant="outline"
                className="w-fit"
                onClick={() => setDatePickerOpen(true)}
              >
                <CalendarDays className="size-4" aria-hidden="true" />
                {relativeDay(date)}
              </Button>

              <Field
                label="Description (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={txType === "expense" ? "e.g. Corner cafe" : "e.g. Salary"}
              />

              {txType === "expense" ? (
                <PillPicker
                  label="Budget"
                  loading={budgetsLoading}
                  loadingText="Loading your budgets…"
                  options={pickableBudgets}
                  selectedId={budgetId}
                  onSelect={setBudgetId}
                />
              ) : (
                <PillPicker
                  label="Income"
                  loading={sourcesLoading}
                  loadingText="Loading your incomes…"
                  options={sources}
                  selectedId={sourceId}
                  onSelect={setSourceId}
                />
              )}

              <Button
                type="submit"
                variant="solid"
                size="block"
                className="mt-1"
                disabled={!valid}
              >
                {editing ? "Save changes" : heading}
              </Button>
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
