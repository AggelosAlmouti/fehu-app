"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_NAME_LENGTH,
  currentMonthKey,
  nameTaken,
  type Budget,
  type BudgetCadence,
  type NewBudget,
} from "@/lib/data";
import { AmountInput } from "@/components/ui/amount-input";
import { Button, Switch } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { MonthStepper } from "@/components/ui/month-stepper";
import { Sheet } from "@/components/ui/sheet";

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
  const [month, setMonth] = useState(currentMonthKey);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setAmount(String(editing.amount));
      setName(editing.name);
      setCadence(editing.cadence);
      setMonth(editing.cadence === "one-time" && editing.month ? editing.month : currentMonthKey());
    } else {
      setAmount("");
      setName("");
      setCadence("monthly");
      setMonth(currentMonthKey());
    }
  }, [open, editing]);

  const parsed = Number.parseFloat(amount);
  const trimmedName = name.trim();
  const duplicate = nameTaken(budgets, trimmedName, editing?.id);
  const valid =
    trimmedName.length > 0 &&
    !duplicate &&
    Number.isFinite(parsed) &&
    parsed > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const payload: NewBudget = {
      name: trimmedName,
      amount: parsed,
      cadence,
      ...(cadence === "one-time" ? { month } : {}),
    };
    if (editing) onUpdate(editing.id, payload);
    else onAdd(payload);
    onClose();
  }

  const heading = editing ? "Edit budget" : "Add budget";

  return (
    <Sheet open={open} onClose={onClose} title={heading} initialFocus={amountRef}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <AmountInput value={amount} onChange={setAmount} inputRef={amountRef} />

        <Field
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Groceries"
          maxLength={MAX_NAME_LENGTH}
          error={duplicate ? `You already have a budget named "${trimmedName}".` : undefined}
        />

        <div>
          <span className="mb-1.5 block text-label">Repeats</span>
          <Switch
            checked={cadence === "one-time"}
            onChange={(oneTime) => setCadence(oneTime ? "one-time" : "monthly")}
            label="Scope this budget to a single month, like a trip"
          >
            {cadence === "monthly" ? "Every month" : "One month only"}
          </Switch>
          <p className="mt-1.5 text-caption">
            {cadence === "monthly"
              ? "Resets to zero at the start of each month."
              : "For a trip or other one-off spending — only counts expenses in the month below, then disappears from the dashboard."}
          </p>
          {cadence === "one-time" && (
            <div className="mt-3 flex items-center justify-between card-box px-3 py-2">
              <MonthStepper month={month} onChange={setMonth} />
            </div>
          )}
        </div>

        <Button type="submit" variant="solid" size="block" className="mt-1" disabled={!valid}>
          {editing ? "Save changes" : "Add budget"}
        </Button>
      </form>
    </Sheet>
  );
}
