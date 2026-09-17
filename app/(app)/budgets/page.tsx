"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { formatCurrency, monthLabel, type Budget, type IncomeSource } from "@/lib/data";
import { AddBudgetSheet } from "@/components/add-budget-sheet";
import { AddIncomeSourceSheet } from "@/components/add-income-source-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { LoadingPill } from "@/components/loading-pill";
import { useAuth } from "@/lib/use-auth";
import { useCurrency } from "@/lib/use-currency";
import { useBudgets } from "@/lib/use-budgets";
import { useIncomeSources } from "@/lib/use-income-sources";

export default function BudgetsPage() {
  const router = useRouter();
  const { effectiveUser } = useAuth();
  const { currency } = useCurrency();
  const { budgets, loading, addBudget, updateBudget, deleteBudget } = useBudgets(
    effectiveUser?.uid,
  );
  const {
    sources,
    loading: sourcesLoading,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
  } = useIncomeSources(effectiveUser?.uid);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Budget | null>(null);

  const [sourceSheetOpen, setSourceSheetOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
  const [pendingDeleteSource, setPendingDeleteSource] =
    useState<IncomeSource | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("add") === "1") {
      setSheetOpen(true);
      router.replace("/budgets");
    } else if (params.get("addSource") === "1") {
      setSourceSheetOpen(true);
      router.replace("/budgets");
    }
  }, [router]);

  const sorted = [...budgets].sort((a, b) => b.amount - a.amount);
  const total = budgets.reduce((sum, b) => sum + b.amount, 0);
  const sortedSources = [...sources].sort((a, b) => a.name.localeCompare(b.name));

  function openAdd() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(b: Budget) {
    setEditing(b);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditing(null);
  }

  function openAddSource() {
    setEditingSource(null);
    setSourceSheetOpen(true);
  }

  function openEditSource(s: IncomeSource) {
    setEditingSource(s);
    setSourceSheetOpen(true);
  }

  function closeSourceSheet() {
    setSourceSheetOpen(false);
    setEditingSource(null);
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-32 pt-6 md:pt-10">
      {(loading || sourcesLoading) && <LoadingPill />}

      <div className="mb-8 flex items-center justify-between md:mb-10">
        <h1 className="text-2xl font-medium tracking-tight">Budgets</h1>
        <button
          type="button"
          onClick={openAdd}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-accent/40 px-3.5 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add budget
        </button>
      </div>

      <div className="mb-0.5 text-xs text-detail">Total</div>
      <div className="mb-8 text-[34px] font-medium leading-tight tracking-tight text-foreground">
        {formatCurrency(total, currency)}
      </div>

      {sorted.length > 0 ? (
        <ul className="flex flex-col">
          {sorted.map((b, i) => (
            <li
              key={b.id}
              className={`py-3 ${i === sorted.length - 1 ? "" : "border-b border-border"}`}
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-foreground">{b.name}</div>
                  <div className="text-xs text-muted">
                    {b.cadence === "monthly"
                      ? "Monthly"
                      : b.month
                        ? monthLabel(b.month)
                        : "One-time"}
                  </div>
                </div>
                <div className="shrink-0 text-sm font-medium text-foreground">
                  {formatCurrency(b.amount, currency)}
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(b)}
                  aria-label={`Edit ${b.name}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-detail transition-colors hover:text-foreground"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(b)}
                  aria-label={`Delete ${b.name}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-detail transition-colors hover:text-danger"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : loading ? null : (
        <EmptyState icon={Wallet}>
          No budgets yet. Add one to start tracking your spending.
        </EmptyState>
      )}

      <div className="mb-3 mt-10 flex items-center justify-between">
        <h2 className="text-lg font-medium tracking-tight">Income sources</h2>
        <button
          type="button"
          onClick={openAddSource}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-accent/40 px-3.5 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add source
        </button>
      </div>

      {sortedSources.length > 0 ? (
        <ul className="flex flex-col">
          {sortedSources.map((s, i) => (
            <li
              key={s.id}
              className={`py-3 ${i === sortedSources.length - 1 ? "" : "border-b border-border"}`}
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {s.name}
                </div>
                <button
                  type="button"
                  onClick={() => openEditSource(s)}
                  aria-label={`Edit ${s.name}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-detail transition-colors hover:text-foreground"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteSource(s)}
                  aria-label={`Delete ${s.name}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-detail transition-colors hover:text-danger"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : sourcesLoading ? null : (
        <EmptyState icon={Coins}>
          No income sources yet. Add one to start tagging where your income comes from.
        </EmptyState>
      )}

      <AddBudgetSheet
        open={sheetOpen}
        editing={editing}
        budgets={budgets}
        onClose={closeSheet}
        onAdd={addBudget}
        onUpdate={updateBudget}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete budget"
        description={
          pendingDelete
            ? `Delete "${pendingDelete.name}"? This can't be undone.`
            : ""
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteBudget(pendingDelete.id);
          setPendingDelete(null);
        }}
      />

      <AddIncomeSourceSheet
        open={sourceSheetOpen}
        editing={editingSource}
        sources={sources}
        onClose={closeSourceSheet}
        onAdd={addIncomeSource}
        onUpdate={updateIncomeSource}
      />

      <ConfirmDialog
        open={pendingDeleteSource !== null}
        title="Delete income source"
        description={
          pendingDeleteSource
            ? `Delete "${pendingDeleteSource.name}"? This can't be undone.`
            : ""
        }
        onCancel={() => setPendingDeleteSource(null)}
        onConfirm={() => {
          if (pendingDeleteSource) deleteIncomeSource(pendingDeleteSource.id);
          setPendingDeleteSource(null);
        }}
      />
    </div>
  );
}
