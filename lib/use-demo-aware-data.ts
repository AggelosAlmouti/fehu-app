"use client";

import { useEffect, useMemo, useState } from "react";
import { generateDummyData } from "@/lib/dummy-data";
import { useTransactions } from "@/lib/use-transactions";
import { useBudgets } from "@/lib/use-budgets";
import { useIncomeSources } from "@/lib/use-income-sources";

function noop() {}

export function useDemoAwareData(uid: string | undefined) {
  const live = useTransactions(uid);
  const liveBudgets = useBudgets(uid);
  const liveSources = useIncomeSources(uid);

  const [demoMode, setDemoMode] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    setDemoMode(new URLSearchParams(window.location.search).get("demo") === "1");
  }, []);
  const demoData = useMemo(
    () => (process.env.NODE_ENV === "production" ? null : generateDummyData()),
    [],
  );

  return {
    transactions: demoMode && demoData ? demoData.transactions : live.transactions,
    budgets: demoMode && demoData ? demoData.budgets : liveBudgets.budgets,
    sources: demoMode && demoData ? demoData.incomeSources : liveSources.sources,
    addTransaction: demoMode ? noop : live.addTransaction,
    updateTransaction: demoMode ? noop : live.updateTransaction,
    deleteTransaction: demoMode ? noop : live.deleteTransaction,
    transactionsLoading: demoMode ? false : live.loading,
    budgetsLoading: demoMode ? false : liveBudgets.loading,
    sourcesLoading: demoMode ? false : liveSources.loading,
  };
}
