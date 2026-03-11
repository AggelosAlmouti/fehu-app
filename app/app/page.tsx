"use client";

import { useState } from "react";
import styles from "./page.module.css";

const budgets = [
  {name: "Food", spent: 40, total: 100},
  { name: "Transport", spent: 60, total: 80 },
  { name: "Entertainment", spent: 20, total: 50 },
  { name: "Utilities", spent: 90, total: 90 },
  { name: "Shopping", spent: 30, total: 120 },
]

const today = new Date();
const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
const monthProgress = today.getDate() / daysInMonth;

function getBarColor(spent: number, total: number) {
  const spentRatio = spent / total;
  if (spentRatio >= 1) return "red";
  if (spentRatio > monthProgress) return "orange";
  return "green";
}

export default function App() {
  const [activeTab, setActiveTab] = useState("spending");

  return (
    <main className={styles.main}>
      {/* Hero */}
      <div className={styles.tabs}>
        <button 
        className={`${styles.tab} ${activeTab === "spending" ? styles.activeTab : ""}`}
        onClick={() => setActiveTab("spending")}>Spending</button>
        <button 
        className={`${styles.tab} ${activeTab === "income" ? styles.activeTab : ""}`}
        onClick={() => setActiveTab("income")}>Income</button>
      </div>

      <div className={styles.hero}>
        <p className={styles.heroLabel}>{activeTab === "spending" ? "Spent" : "Earned"} this month</p>
        <p className={styles.heroAmount}>{activeTab === "spending" ? "350" : "1800"}€</p>
      </div>

      {/* Budget Cards */}
      {activeTab === "spending" && (
        <div className={styles.budgets}>
          <h3>Budgets</h3>
          {budgets.map((budget) => (
            <div key={budget.name} className={styles.budgetCard}>
              <div className={styles.budgetHeader}>
                <span>{budget.name}</span>
                <span>{budget.spent}/{budget.total}€</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressBar}
                style = {{width: `${Math.min((budget.spent / budget.total) * 100, 100)}%`, 
                backgroundColor: getBarColor(budget.spent, budget.total),}} 
                />
                <div className={styles.tick} style={{ left: "25%" }}/>
                <div className={styles.tick} style={{ left: "50%" }}/>
                <div className={styles.tick} style={{ left: "75%" }}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
