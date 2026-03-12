"use client";

import { useState } from "react";
import styles from "./page.module.css";
import BudgetCard from "../components/BudgetCard/BudgetCard";

const budgets = [
  { name: "Food", spent: 40, total: 100 },
  { name: "Transport", spent: 60, total: 80 },
  { name: "Entertainment", spent: 20, total: 50 },
  { name: "Utilities", spent: 90, total: 90 },
  { name: "Shopping", spent: 30, total: 120 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("spending");

  return (
    <main className={styles.main}>
      {/* Hero */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "spending" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("spending")}
        >
          Spending
        </button>
        <button
          className={`${styles.tab} ${activeTab === "income" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("income")}
        >
          Income
        </button>
      </div>

      <div className={styles.hero}>
        <p className={styles.heroLabel}>
          {activeTab === "spending" ? "Spent" : "Earned"} this month
        </p>
        <p className={styles.heroAmount}>
          {activeTab === "spending" ? "350" : "1800"}€
        </p>
      </div>

      {/* Budget Cards */}
      {activeTab === "spending" && (
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
      )}
    </main>
  );
}
