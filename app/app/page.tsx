"use client";

import styles from "./page.module.css";
import BudgetCard from "../components/BudgetCard/BudgetCard";
import { TrendingUp, TrendingDown } from "lucide-react";

const budgets = [
  { name: "Food", spent: 40, total: 100 },
  { name: "Transport", spent: 60, total: 80 },
  { name: "Entertainment", spent: 20, total: 50 },
  { name: "Utilities", spent: 90, total: 90 },
  { name: "Shopping", spent: 30, total: 120 },
  { name: "Health", spent: 15, total: 60 },
  { name: "Subscriptions", spent: 45, total: 45 },
  { name: "Dining Out", spent: 70, total: 150 },
  { name: "Clothing", spent: 10, total: 80 },
  { name: "Travel", spent: 200, total: 400 },
  { name: "Gym", spent: 35, total: 35 },
  { name: "Personal Care", spent: 25, total: 50 },
];

const totalBalance = 1450;
const earned = { amount: 1800, percentChange: 1.5 };
const spent = { amount: 350, percentChange: 1.5 };

export default function App() {
  return (
    <>
      <div className={styles.hero}>
        <p className={styles.heroLabel}>Total Balance</p>
        <p className={styles.heroAmount}>{totalBalance.toLocaleString()} €</p>
      </div>

      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Earned this month</p>
          <p className={styles.summaryAmount}>
            {earned.amount.toLocaleString()} €
          </p>
          <div className={`${styles.trend} ${styles.trendUp}`}>
            <TrendingUp size={14} />
            <span> {earned.percentChange}%</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Spent this month</p>
          <p className={styles.summaryAmount}>
            {spent.amount.toLocaleString()} €
          </p>
          <div className={`${styles.trend} ${styles.trendDown}`}>
            <TrendingUp size={14} />
            <span> {spent.percentChange}%</span>
          </div>
        </div>
      </div>

      <div className={styles.budgets}>
        <h3>Budgets</h3>
        {budgets.map((budget) => (
          <BudgetCard
            key={budget.name}
            name={budget.name}
            spent={budget.spent}
            total={budget.total}
          />
        ))}
      </div>
    </>
  );
}
