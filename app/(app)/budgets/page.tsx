"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { formatCurrency, monthLabel, type Budget, type IncomeSource } from "@/lib/data";
import { Button } from "@/components/button";
import { IconButton } from "@/components/icon-button";
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
        <h1 className="text-hero">Budgets</h1>
        <Button variant="outline" onClick={openAdd}>
          <Plus className="size-4" aria-hidden="true" />
          Add budget
        </Button>
      </div>

      <div className="mb-0.5 text-label">Total</div>
      <div className="mb-8 text-hero text-foreground">
        {formatCurrency(total, currency)}
      </div>

      {sorted.length > 0 ? (
        <ul className="flex flex-col">
          {sorted.map((b, i) => (
            <li
              key={b.id}
              className={`py-3 ${i === sorted.length - 1 ? "" : "border-b-2 border-border"}`}
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base text-foreground">{b.name}</div>
                  <div className="text-caption">
                    {b.cadence === "monthly"
                      ? "Monthly"
                      : b.month
                        ? monthLabel(b.month)
                        : "One-time"}
                  </div>
                </div>
                <div className="shrink-0 text-base font-medium text-foreground">
                  {formatCurrency(b.amount, currency)}
                </div>
                <IconButton icon={Pencil} label={`Edit ${b.name}`} onClick={() => openEdit(b)} />
                <IconButton icon={Trash2} tone="danger" label={`Delete ${b.name}`} onClick={() => setPendingDelete(b)} />
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
        <h2 className="text-hero">Income sources</h2>
        <Button variant="outline" onClick={openAddSource}>
          <Plus className="size-4" aria-hidden="true" />
          Add source
        </Button>
      </div>

      {sortedSources.length > 0 ? (
        <ul className="flex flex-col">
          {sortedSources.map((s, i) => (
            <li
              key={s.id}
              className={`py-3 ${i === sortedSources.length - 1 ? "" : "border-b-2 border-border"}`}
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1 truncate text-base text-foreground">
                  {s.name}
                </div>
                <IconButton icon={Pencil} label={`Edit ${s.name}`} onClick={() => openEditSource(s)} />
                <IconButton icon={Trash2} tone="danger" label={`Delete ${s.name}`} onClick={() => setPendingDeleteSource(s)} />
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
