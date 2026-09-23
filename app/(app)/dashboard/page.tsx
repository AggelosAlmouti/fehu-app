"use client";

import { useMemo, useState } from "react";
import { Coins, Plus, Wallet } from "lucide-react";
import {
  budgetSpending,
  currentMonthLabel,
  formatCurrency,
  incomeBySource,
  isExpense,
  isIncome,
  isThisMonth,
  sumAmounts,
  type IncomeSource,
  type Transaction,
} from "@/lib/data";
import { useAuth } from "@/lib/use-auth";
import { useCurrency } from "@/lib/use-currency";
import { useDemoAwareData } from "@/lib/demo-data";
import { AddTransactionSheet } from "@/components/transactions/add-transaction-sheet";
import { CardButton, IconButton, IconToggleGroup, TextLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BudgetMeter, MeterCard } from "@/components/ui/meter";
import { LoadingPill } from "@/components/ui/notices";
import { useEditSheet } from "@/components/ui/sheet";
import { Stat } from "@/components/ui/stat";
import {
  BudgetDetailSheet,
  IncomeSourceDetailSheet,
} from "@/components/transactions/transaction-list";

export default function DashboardPage() {
  const { effectiveUser } = useAuth();
  const { currency } = useCurrency();
  const {
    transactions,
    budgets,
    sources,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    transactionsLoading,
    budgetsLoading,
    sourcesLoading,
  } = useDemoAwareData(effectiveUser?.uid);

  const transactionSheet = useEditSheet<Transaction>();
  const [openBudgetId, setOpenBudgetId] = useState<string | null>(null);
  const [openSourceId, setOpenSourceId] = useState<string | null>(null);
  const [view, setView] = useState<"expense" | "income">("expense");

  const monthly = useMemo(
    () => transactions.filter((t) => isThisMonth(t.date)),
    [transactions],
  );
  const spent = useMemo(() => sumAmounts(monthly.filter(isExpense)), [monthly]);
  const earned = useMemo(() => sumAmounts(monthly.filter(isIncome)), [monthly]);
  const net = earned - spent;

  const incomeCards = useMemo(
    () => incomeBySource(sources, transactions),
    [sources, transactions],
  );

  const spending = useMemo(() => budgetSpending(budgets, transactions), [budgets, transactions]);
  const budgetCards = useMemo(
    () => [...spending].sort((a, b) => b.budget.amount - a.budget.amount),
    [spending],
  );

  const openBudget = budgets.find((b) => b.id === openBudgetId) ?? null;
  const openBudgetTransactions = useMemo(
    () => spending.find((s) => s.budget.id === openBudgetId)?.transactions ?? [],
    [spending, openBudgetId],
  );

  const openSource = sources.find((s) => s.id === openSourceId) ?? null;
  const openSourceTransactions = useMemo(
    () => incomeCards.find((c) => c.source.id === openSourceId)?.transactions ?? [],
    [incomeCards, openSourceId],
  );

  return (
    <>
      {(transactionsLoading || budgetsLoading || sourcesLoading) && <LoadingPill />}

      <div className="mb-4.5 flex items-center justify-between">
        <span className="text-label">Welcome back!</span>
        <div className="hidden md:block">
          <IconButton
            icon={Plus}
            tone="solid"
            size="lg"
            label="Add transaction"
            onClick={transactionSheet.openAdd}
          />
        </div>
      </div>

      <div className="mb-5.5 grid grid-flow-col grid-cols-[1fr_auto_auto] grid-rows-[auto_auto] items-baseline gap-x-5">
        <Stat label="Net" tone={net >= 0 ? "gain" : "loss"} className="contents">
          {formatCurrency(net, currency)}
        </Stat>
        <Stat label="Spent" size="strong" className="contents">
          {formatCurrency(spent, currency)}
        </Stat>
        <Stat label="Earned" tone="gain" size="strong" className="contents">
          {formatCurrency(earned, currency)}
        </Stat>
      </div>

      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-label">{currentMonthLabel()}</span>
        <IconToggleGroup
          value={view}
          onChange={setView}
          options={[
            { value: "expense", icon: Wallet, label: "Show budgets" },
            { value: "income", icon: Coins, label: "Show income sources" },
          ]}
        />
      </div>

      {view === "expense" ? (
        budgetCards.length > 0 ? (
          <div className="flex flex-col gap-2">
            {budgetCards.map(({ budget, spent }) => (
              <MeterCard
                key={budget.id}
                name={budget.name}
                value={
                  <span className="text-caption">
                    {formatCurrency(spent, currency)} / {formatCurrency(budget.amount, currency)}
                  </span>
                }
                onClick={() => setOpenBudgetId(budget.id)}
              >
                <BudgetMeter spent={spent} limit={budget.amount} />
              </MeterCard>
            ))}
          </div>
        ) : budgetsLoading ? null : (
          <EmptyState icon={Wallet}>
            No budgets set yet. Add one from{" "}
            <TextLink href="/budgets">Budgets</TextLink> to start tracking
            spending.
          </EmptyState>
        )
      ) : incomeCards.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {incomeCards.map(({ source, earned }) => (
            <IncomeSourceCard
              key={source.id}
              source={source}
              earned={earned}
              onClick={() => setOpenSourceId(source.id)}
            />
          ))}
        </div>
      ) : sourcesLoading ? null : (
        <EmptyState icon={Coins}>
          No income sources yet. Add one from{" "}
          <TextLink href="/budgets">Budgets</TextLink> to start tracking
          income.
        </EmptyState>
      )}

      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <IconButton
          icon={Plus}
          tone="solid"
          size="fab"
          label="Add transaction"
          className="floating"
          onClick={transactionSheet.openAdd}
        />
      </div>

      <BudgetDetailSheet
        budget={openBudget}
        transactions={openBudgetTransactions}
        onClose={() => setOpenBudgetId(null)}
        onEdit={transactionSheet.openEdit}
        onDelete={deleteTransaction}
      />

      <IncomeSourceDetailSheet
        source={openSource}
        transactions={openSourceTransactions}
        onClose={() => setOpenSourceId(null)}
        onEdit={transactionSheet.openEdit}
        onDelete={deleteTransaction}
      />

      <AddTransactionSheet
        open={transactionSheet.open}
        editing={transactionSheet.editing}
        budgets={budgets}
        budgetsLoading={budgetsLoading}
        sources={sources}
        sourcesLoading={sourcesLoading}
        onClose={transactionSheet.close}
        onAdd={addTransaction}
        onUpdate={updateTransaction}
      />
    </>
  );
}

function IncomeSourceCard({
  source,
  earned,
  onClick,
}: {
  source: IncomeSource;
  earned: number;
  onClick: () => void;
}) {
  const { currency } = useCurrency();

  return (
    <CardButton
      onClick={onClick}
      className="flex aspect-square flex-col justify-between p-2"
    >
      <span className="truncate text-body text-foreground">{source.name}</span>
      <span className="truncate text-strong text-accent">
        {formatCurrency(earned, currency)}
      </span>
    </CardButton>
  );
}
