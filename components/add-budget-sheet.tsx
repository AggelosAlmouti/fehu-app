"use client";

import { useEffect, useRef, useState } from "react";
import { todayISO, type Budget, type BudgetCadence } from "@/lib/data";
import type { NewBudget } from "@/lib/use-budgets";
import { AmountInput } from "@/components/amount-input";
import { Sheet } from "@/components/sheet";
import { SheetHeader } from "@/components/sheet-header";

const MAX_NAME_LENGTH = 30;

export function AddBudgetSheet({
  open,
  editing,
  budgets,
  onClose,
  onAdd,
  onUpdate,
}: {
  open: boolean;
  /** Budget being edited, or null when adding a new one. */
  editing: Budget | null;
  /** Existing budgets, checked against the name field for duplicates. */
  budgets: Budget[];
  onClose: () => void;
  onAdd: (budget: NewBudget) => void;
  onUpdate: (id: string, patch: NewBudget) => void;
}) {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [cadence, setCadence] = useState<BudgetCadence>("monthly");
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setAmount(String(editing.amount));
      setName(editing.name);
      setCadence(editing.cadence);
    } else {
      setAmount("");
      setName("");
      setCadence("monthly");
    }
    const t = setTimeout(() => amountRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open, editing]);

  const parsed = Number.parseFloat(amount);
  const trimmedName = name.trim();
  const duplicate = budgets.some(
    (b) =>
      b.id !== editing?.id &&
      b.name.toLowerCase() === trimmedName.toLowerCase(),
  );
  const valid =
    trimmedName.length > 0 &&
    !duplicate &&
    Number.isFinite(parsed) &&
    parsed > 0;

  const preservedMonth =
    editing && editing.cadence === "one-time" ? editing.month : undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const payload: NewBudget = {
      name: trimmedName,
      amount: parsed,
      cadence,
      ...(cadence === "one-time"
        ? { month: preservedMonth ?? todayISO().slice(0, 7) }
        : {}),
    };
    if (editing) onUpdate(editing.id, payload);
    else onAdd(payload);
    onClose();
  }

  const heading = editing ? "Edit budget" : "Add budget";

  return (
    <Sheet open={open} onClose={onClose} ariaLabel={heading}>
      <SheetHeader title={heading} onClose={onClose} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <AmountInput value={amount} onChange={setAmount} inputRef={amountRef} />

        <div>
          <label
            htmlFor="budget-name"
            className="mb-1.5 block text-xs text-detail"
          >
            Name
          </label>
          <input
            id="budget-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Groceries"
            maxLength={MAX_NAME_LENGTH}
            className="w-full rounded-[var(--radius-card)] border border-border bg-card px-3.5 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-border-strong"
          />
          {duplicate && (
            <p className="mt-1.5 text-xs text-danger">
              You already have a budget named "{trimmedName}".
            </p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-xs text-detail">Repeats</span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              role="switch"
              aria-checked={cadence === "one-time"}
              aria-label="Scope this budget to the current month only"
              onClick={() =>
                setCadence(cadence === "monthly" ? "one-time" : "monthly")
              }
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                cadence === "one-time" ? "bg-accent" : "bg-border-strong"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-foreground transition-transform ${
                  cadence === "one-time" ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm text-foreground">
              {cadence === "monthly" ? "Every month" : "One-time"}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {cadence === "monthly"
              ? "Resets to zero at the start of each month."
              : "Only for the current month."}
          </p>
        </div>

        <button
          type="submit"
          disabled={!valid}
          className="mt-1 w-full rounded-full bg-accent py-3.5 text-sm font-medium text-background transition-opacity disabled:opacity-40"
        >
          {editing ? "Save changes" : "Add budget"}
        </button>
      </form>
    </Sheet>
  );
}
