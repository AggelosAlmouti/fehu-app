"use client";

import { useEffect, useRef, useState } from "react";
import type { Budget, BudgetCadence } from "@/lib/data";
import type { NewBudget } from "@/lib/use-budgets";
import { AmountInput } from "@/components/amount-input";
import { Sheet } from "@/components/sheet";
import { SheetHeader } from "@/components/sheet-header";

export function AddBudgetSheet({
  open,
  editing,
  onClose,
  onAdd,
  onUpdate,
}: {
  open: boolean;
  /** Budget being edited, or null when adding a new one. */
  editing: Budget | null;
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
  const valid = name.trim().length > 0 && Number.isFinite(parsed) && parsed > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const payload: NewBudget = { name: name.trim(), amount: parsed, cadence };
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
            className="w-full rounded-[var(--radius-card)] border border-border bg-card px-3.5 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-border-strong"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-detail">
            {cadence === "monthly" ? "Monthly budget" : "One-time budget"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={cadence === "one-time"}
            aria-label="One-time budget"
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
