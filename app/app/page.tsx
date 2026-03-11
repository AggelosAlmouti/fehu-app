"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("spending");

  return (
    <main className={styles.main}>
      <div className={styles.tabs}>
        <button 
        className={`${styles.tab} ${activeTab === "spending" ? styles.activeTab : ""}`}
        onClick={() => setActiveTab("spending")}>Spending</button>
        <button 
        className={`${styles.tab} ${activeTab === "income" ? styles.activeTab : ""}`}
        onClick={() => setActiveTab("income")}>Income</button>
      </div>

      <div className={styles.hero}>
        <p className={styles.heroAmount}>{activeTab === "spending" ? "350" : "1800"} €</p>
        <p className={styles.heroLabel}>{activeTab === "spending" ? "Spent" : "Earned"} this month</p>
      </div>
    </main>
  );
}
