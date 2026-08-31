import { toLocalISODate, type Budget, type Transaction } from "@/lib/data";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function generateDummyData(): { budgets: Budget[]; transactions: Transaction[] } {
  const rand = seededRandom(42);
  const budgets: Budget[] = [
    { id: "d-groceries", name: "Groceries", amount: 400, cadence: "monthly" },
    { id: "d-rent", name: "Rent", amount: 950, cadence: "monthly" },
    { id: "d-transport", name: "Transport", amount: 120, cadence: "monthly" },
    { id: "d-entertainment", name: "Entertainment", amount: 150, cadence: "monthly" },
    { id: "d-laptop", name: "New laptop", amount: 1200, cadence: "one-time" },
    { id: "d-vacation", name: "Vacation fund", amount: 2000, cadence: "one-time" },
  ];

  const transactions: Transaction[] = [];
  let txId = 0;
  const now = new Date();

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
      date: dateInMonth(reference.getFullYear(), reference.getMonth(), 1),
    });

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

  const oneTimeContributions: { budgetId: string; title: string; monthsAgo: number[] }[] = [
    { budgetId: "d-laptop", title: "Laptop payment", monthsAgo: [9, 5, 1] },
    { budgetId: "d-vacation", title: "Vacation savings", monthsAgo: [10, 7, 4, 2] },
  ];
  for (const { budgetId, title, monthsAgo } of oneTimeContributions) {
    for (const m of monthsAgo) {
      const reference = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const daysInMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();
      transactions.push({
        id: `d-tx-${txId++}`,
        type: "expense",
        title,
        amount: Math.round((100 + rand() * 300) * 100) / 100,
        budgetId,
        date: dateInMonth(reference.getFullYear(), reference.getMonth(), 1 + Math.floor(rand() * daysInMonth)),
      });
    }
  }

  transactions.sort((a, b) => b.date.localeCompare(a.date));
  return { budgets, transactions };
}
