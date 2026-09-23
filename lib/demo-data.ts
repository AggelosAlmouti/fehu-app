"use client";

import { useEffect, useMemo, useState } from "react";
import { useBudgets, useIncomeSources, useTransactions } from "@/lib/firestore";
import {
  currentMonthKey,
  shiftMonthKey,
  toLocalISODate,
  type Budget,
  type IncomeSource,
  type Transaction,
} from "@/lib/data";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateDummyData(): {
  budgets: Budget[];
  transactions: Transaction[];
  incomeSources: IncomeSource[];
} {
  const rand = seededRandom(42);
  const now = new Date();

  const incomeSources: IncomeSource[] = [
    { id: "d-salary", name: "Salary" },
    { id: "d-freelance", name: "Freelance" },
    { id: "d-gifts", name: "Gifts" },
  ];

  const monthKeyFor = (monthsAgo: number) => shiftMonthKey(currentMonthKey(), -monthsAgo);

  const budgets: Budget[] = [
    { id: "d-groceries", name: "Groceries", amount: 400, cadence: "monthly" },
    { id: "d-rent", name: "Rent", amount: 950, cadence: "monthly" },
    { id: "d-transport", name: "Transport", amount: 120, cadence: "monthly" },
    { id: "d-entertainment", name: "Entertainment", amount: 150, cadence: "monthly" },
    { id: "d-vienna", name: "Vienna trip", amount: 900, cadence: "one-time", month: monthKeyFor(8) },
    { id: "d-rome", name: "Rome trip", amount: 700, cadence: "one-time", month: monthKeyFor(3) },
    { id: "d-berlin", name: "Berlin trip", amount: 400, cadence: "one-time", month: monthKeyFor(0) },
  ];

  const transactions: Transaction[] = [];
  let txId = 0;

  function pick<T>(options: T[]): T {
    return options[Math.floor(rand() * options.length)];
  }

  function dateInMonth(year: number, month: number, day: number): string {
    return toLocalISODate(new Date(year, month, day));
  }

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const year = now.getFullYear();
    const month = now.getMonth() - monthsAgo;
    const reference = new Date(year, month, 1);
    const daysInMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();
    const activeDays = monthsAgo === 0 ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
    const isCurrentMonth = monthsAgo === 0;

    let monthSpent = 0;
    let monthEarned = 0;

    function addExpense(budgetId: string, title: string, amount: number, day: number) {
      monthSpent += amount;
      transactions.push({
        id: `d-tx-${txId++}`,
        type: "expense",
        title,
        amount,
        budgetId,
        date: dateInMonth(reference.getFullYear(), reference.getMonth(), day),
      });
    }

    const salary = 2800 + Math.round(rand() * 200);
    monthEarned += salary;
    transactions.push({
      id: `d-tx-${txId++}`,
      type: "income",
      title: "Salary",
      amount: salary,
      sourceId: "d-salary",
      date: dateInMonth(reference.getFullYear(), reference.getMonth(), 1),
    });

    if (rand() > 0.35) {
      const freelance = Math.round((150 + rand() * 500) * 100) / 100;
      monthEarned += freelance;
      transactions.push({
        id: `d-tx-${txId++}`,
        type: "income",
        title: pick(["Freelance project", "Client invoice", "Contract work"]),
        amount: freelance,
        sourceId: "d-freelance",
        date: dateInMonth(reference.getFullYear(), reference.getMonth(), 1 + Math.floor(rand() * activeDays)),
      });
    }

    if (rand() > 0.75) {
      const gift = Math.round((20 + rand() * 100) * 100) / 100;
      monthEarned += gift;
      transactions.push({
        id: `d-tx-${txId++}`,
        type: "income",
        title: "From Mom",
        amount: gift,
        sourceId: "d-gifts",
        date: dateInMonth(reference.getFullYear(), reference.getMonth(), 1 + Math.floor(rand() * activeDays)),
      });
    }

    addExpense("d-rent", "Monthly rent", 950, Math.min(2, activeDays));

    const groceryCount = 4 + Math.floor(rand() * 3);
    for (let i = 0; i < groceryCount; i++) {
      addExpense(
        "d-groceries",
        pick(["Supermarket run", "Farmers market", "Corner shop"]),
        Math.round((20 + rand() * 60) * 100) / 100,
        1 + Math.floor(rand() * activeDays),
      );
    }

    const transportCount = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < transportCount; i++) {
      addExpense(
        "d-transport",
        pick(["Metro pass", "Taxi", "Fuel"]),
        Math.round((8 + rand() * 40) * 100) / 100,
        1 + Math.floor(rand() * activeDays),
      );
    }

    if (rand() > 0.2) {
      addExpense(
        "d-entertainment",
        pick(["Cinema", "Concert tickets", "Streaming subscription"]),
        Math.round((10 + rand() * 50) * 100) / 100,
        1 + Math.floor(rand() * activeDays),
      );
    }

    if (isCurrentMonth && monthEarned - monthSpent >= 0) {
      const overage = monthEarned - monthSpent + 200 + Math.round(rand() * 300);
      addExpense("d-transport", "Car repair", overage, Math.min(activeDays, Math.max(1, now.getDate())));
    }
  }

  const trips: { budgetId: string; title: string; monthsAgo: number; items: [string, number][] }[] = [
    {
      budgetId: "d-vienna",
      title: "Vienna",
      monthsAgo: 8,
      items: [["Flights", 260], ["Hotel", 340], ["Museums", 45], ["Dinner out", 60], ["Coffee & pastries", 25]],
    },
    {
      budgetId: "d-rome",
      title: "Rome",
      monthsAgo: 3,
      items: [["Flights", 180], ["Hotel", 260], ["Colosseum tickets", 32], ["Gelato & dinners", 90]],
    },
    {
      budgetId: "d-berlin",
      title: "Berlin",
      monthsAgo: 0,
      items: [["Flights", 140], ["Hostel", 90]],
    },
  ];
  for (const trip of trips) {
    const reference = new Date(now.getFullYear(), now.getMonth() - trip.monthsAgo, 1);
    const daysInMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();
    const cap = trip.monthsAgo === 0 ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
    trip.items.forEach(([title, amount], i) => {
      transactions.push({
        id: `d-tx-${txId++}`,
        type: "expense",
        title: `${trip.title} — ${title}`,
        amount,
        budgetId: trip.budgetId,
        date: dateInMonth(reference.getFullYear(), reference.getMonth(), Math.min(cap, 1 + i * 2)),
      });
    });
  }

  return { budgets, transactions, incomeSources };
}

function noop() {}

// Dev-only: ?demo=1 on Dashboard or Insights swaps in a generated year of data.
export function useDemoAwareData(uid: string | undefined) {
  const live = useTransactions(uid);
  const liveBudgets = useBudgets(uid);
  const liveSources = useIncomeSources(uid);

  const [demoMode, setDemoMode] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    setDemoMode(new URLSearchParams(window.location.search).get("demo") === "1");
  }, []);
  const demo = useMemo(() => (demoMode ? generateDummyData() : null), [demoMode]);

  if (demo) {
    return {
      transactions: demo.transactions,
      budgets: demo.budgets,
      sources: demo.incomeSources,
      addTransaction: noop,
      updateTransaction: noop,
      deleteTransaction: noop,
      transactionsLoading: false,
      budgetsLoading: false,
      sourcesLoading: false,
    };
  }
  return {
    transactions: live.transactions,
    budgets: liveBudgets.budgets,
    sources: liveSources.sources,
    addTransaction: live.addTransaction,
    updateTransaction: live.updateTransaction,
    deleteTransaction: live.deleteTransaction,
    transactionsLoading: live.loading,
    budgetsLoading: liveBudgets.loading,
    sourcesLoading: liveSources.loading,
  };
}
