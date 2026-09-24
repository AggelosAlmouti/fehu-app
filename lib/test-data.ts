import {
  currentMonthKey,
  shiftMonthKey,
  toLocalISODate,
  type Budget,
  type IncomeSource,
  type Transaction,
} from "@/lib/data";

const HISTORY_MONTHS = 18;
const FUTURE_MONTHS = 2;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Dev-only test data (see Settings): 18 months of history through today plus
// two future months of scheduled entries. Seeded, so every run matches.
export function generateTestData(): {
  budgets: Budget[];
  incomeSources: IncomeSource[];
  transactions: Transaction[];
} {
  const rand = seededRandom(42);
  const today = new Date();
  const between = (min: number, max: number) =>
    Math.round((min + rand() * (max - min)) * 100) / 100;
  const pick = <T,>(options: T[]) => options[Math.floor(rand() * options.length)];

  // Clamped to the month's length, and to today in the current month.
  function dateIn(monthOffset: number, day: number): string {
    const first = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const last = monthOffset === 0
      ? today.getDate()
      : new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    return toLocalISODate(new Date(first.getFullYear(), first.getMonth(), Math.min(day, last)));
  }

  const incomeSources: IncomeSource[] = [
    { id: "t-salary", name: "Salary" },
    { id: "t-freelance", name: "Freelance" },
    { id: "t-gifts", name: "Gifts" },
  ];

  const trips = [
    { id: "t-vienna", name: "Vienna trip", amount: 900, offset: -14, items: [["Flights", 260], ["Hotel", 340], ["Museums", 45], ["Dinner out", 60]] },
    { id: "t-rome", name: "Rome trip", amount: 700, offset: -8, items: [["Flights", 180], ["Hotel", 260], ["Colosseum tickets", 32], ["Gelato & dinners", 90]] },
    { id: "t-berlin", name: "Berlin trip", amount: 400, offset: 0, items: [["Flights", 140], ["Hostel", 90]] },
    { id: "t-lisbon", name: "Lisbon trip", amount: 800, offset: 1, items: [["Flights", 190], ["Hotel", 320]] },
  ] as const;

  const budgets: Budget[] = [
    { id: "t-groceries", name: "Groceries", amount: 400, cadence: "monthly" },
    { id: "t-rent", name: "Rent", amount: 950, cadence: "monthly" },
    { id: "t-transport", name: "Transport", amount: 120, cadence: "monthly" },
    { id: "t-entertainment", name: "Entertainment", amount: 150, cadence: "monthly" },
    ...trips.map((t): Budget => ({
      id: t.id,
      name: t.name,
      amount: t.amount,
      cadence: "one-time",
      month: shiftMonthKey(currentMonthKey(), t.offset),
    })),
  ];

  const transactions: Transaction[] = [];
  let n = 0;
  const expense = (budgetId: string, title: string, amount: number, date: string) =>
    transactions.push({ id: `t-tx-${n++}`, type: "expense", title, amount, budgetId, date });
  const income = (sourceId: string, title: string, amount: number, date: string) =>
    transactions.push({ id: `t-tx-${n++}`, type: "income", title, amount, sourceId, date });

  for (let offset = 1 - HISTORY_MONTHS; offset <= 0; offset++) {
    const randomDay = () => 1 + Math.floor(rand() * 28);

    income("t-salary", "Salary", between(2800, 3000), dateIn(offset, 1));
    if (rand() > 0.4) {
      income("t-freelance", pick(["Client invoice", "Freelance project", "Contract work"]), between(150, 650), dateIn(offset, randomDay()));
    }
    if (rand() > 0.8) income("t-gifts", "Birthday gift", between(20, 120), dateIn(offset, randomDay()));

    expense("t-rent", "Monthly rent", 950, dateIn(offset, 2));
    for (let i = 4 + Math.floor(rand() * 3); i > 0; i--) {
      expense("t-groceries", pick(["Supermarket run", "Farmers market", "Corner shop"]), between(20, 80), dateIn(offset, randomDay()));
    }
    for (let i = 2 + Math.floor(rand() * 3); i > 0; i--) {
      expense("t-transport", pick(["Metro pass", "Taxi", "Fuel"]), between(8, 48), dateIn(offset, randomDay()));
    }
    if (rand() > 0.2) {
      expense("t-entertainment", pick(["Cinema", "Concert tickets", "Streaming subscription"]), between(10, 60), dateIn(offset, randomDay()));
    }
  }

  // Already scheduled for the coming months.
  for (let offset = 1; offset <= FUTURE_MONTHS; offset++) {
    income("t-salary", "Salary", 2900, dateIn(offset, 1));
    expense("t-rent", "Monthly rent", 950, dateIn(offset, 2));
  }

  for (const trip of trips) {
    trip.items.forEach(([title, amount], i) =>
      expense(trip.id, `${trip.name.replace(" trip", "")}: ${title}`, amount, dateIn(trip.offset, 1 + i * 2)),
    );
  }

  return { budgets, incomeSources, transactions };
}
