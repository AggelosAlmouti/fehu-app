"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Plus, Wallet } from "lucide-react";
import { formatCurrency, monthLabel, sumAmounts, type Budget, type IncomeSource } from "@/lib/data";
import { useAuth } from "@/lib/use-auth";
import { useBudgets, useIncomeSources } from "@/lib/firestore";
import { useCurrency } from "@/lib/use-currency";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow, RowList } from "@/components/ui/list-row";
import { LoadingPill } from "@/components/ui/notices";
import { useEditSheet } from "@/components/ui/sheet";
import { Stat } from "@/components/ui/stat";
import { AddBudgetSheet } from "@/components/budgets/add-budget-sheet";
import { AddIncomeSourceSheet } from "@/components/budgets/add-income-source-sheet";

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

  const budgetSheet = useEditSheet<Budget>();
  const sourceSheet = useEditSheet<IncomeSource>();
  const [pendingDelete, setPendingDelete] = useState<Budget | null>(null);
  const [pendingDeleteSource, setPendingDeleteSource] =
    useState<IncomeSource | null>(null);

  // Deep links from the add-transaction sheet's "add one first" prompt.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("add") === "1") {
      budgetSheet.openAdd();
      router.replace("/budgets");
    } else if (params.get("addSource") === "1") {
      sourceSheet.openAdd();
      router.replace("/budgets");
    }
  }, [router]);

  const sorted = [...budgets].sort((a, b) => b.amount - a.amount);
  const sortedSources = [...sources].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      {(loading || sourcesLoading) && <LoadingPill />}

      <PageHeader
        title="Budgets"
        action={
          <Button variant="outline" onClick={budgetSheet.openAdd}>
            <Plus className="size-4" aria-hidden="true" />
            Add budget
          </Button>
        }
      />

      <Stat label="Total" className="mb-8">
        {formatCurrency(sumAmounts(budgets), currency)}
      </Stat>

      {sorted.length > 0 ? (
        <RowList>
          {sorted.map((b) => (
            <ListRow
              key={b.id}
              title={b.name}
              subtitle={
                b.cadence === "monthly"
                  ? "Monthly"
                  : b.month
                    ? monthLabel(b.month)
                    : "One-time"
              }
              value={formatCurrency(b.amount, currency)}
              onEdit={() => budgetSheet.openEdit(b)}
              onDelete={() => setPendingDelete(b)}
            />
          ))}
        </RowList>
      ) : loading ? null : (
        <EmptyState icon={Wallet}>
          No budgets yet. Add one to start tracking your spending.
        </EmptyState>
      )}

      <div className="mb-3 mt-10 flex items-center justify-between">
        <h2 className="text-hero">Income sources</h2>
        <Button variant="outline" onClick={sourceSheet.openAdd}>
          <Plus className="size-4" aria-hidden="true" />
          Add source
        </Button>
      </div>

      {sortedSources.length > 0 ? (
        <RowList>
          {sortedSources.map((s) => (
            <ListRow
              key={s.id}
              title={s.name}
              onEdit={() => sourceSheet.openEdit(s)}
              onDelete={() => setPendingDeleteSource(s)}
            />
          ))}
        </RowList>
      ) : sourcesLoading ? null : (
        <EmptyState icon={Coins}>
          No income sources yet. Add one to start tagging where your income comes from.
        </EmptyState>
      )}

      <AddBudgetSheet
        open={budgetSheet.open}
        editing={budgetSheet.editing}
        budgets={budgets}
        onClose={budgetSheet.close}
        onAdd={addBudget}
        onUpdate={updateBudget}
      />

      <AddIncomeSourceSheet
        open={sourceSheet.open}
        editing={sourceSheet.editing}
        sources={sources}
        onClose={sourceSheet.close}
        onAdd={addIncomeSource}
        onUpdate={updateIncomeSource}
      />

      <ConfirmDeleteDialog
        noun="budget"
        name={pendingDelete?.name ?? null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteBudget(pendingDelete.id);
          setPendingDelete(null);
        }}
      />

      <ConfirmDeleteDialog
        noun="income source"
        name={pendingDeleteSource?.name ?? null}
        onCancel={() => setPendingDeleteSource(null)}
        onConfirm={() => {
          if (pendingDeleteSource) deleteIncomeSource(pendingDeleteSource.id);
          setPendingDeleteSource(null);
        }}
      />
    </>
  );
}
