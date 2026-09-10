"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Budget, BudgetCadence } from "@/lib/data";

export type NewBudget = {
  name: string;
  amount: number;
  cadence: BudgetCadence;
  /** Only set for one-time budgets — the "YYYY-MM" month it's scoped to. */
  month?: string;
};

export const DEFAULT_BUDGETS: NewBudget[] = [
  { name: "Groceries", amount: 300, cadence: "monthly" },
  { name: "Housing", amount: 800, cadence: "monthly" },
  { name: "Transportation", amount: 100, cadence: "monthly" },
  { name: "Coffee", amount: 30, cadence: "monthly" },
  { name: "Eating out", amount: 100, cadence: "monthly" },
];

export async function seedDefaultBudgets(uid: string) {
  const batch = writeBatch(db);
  const budgetsRef = collection(db, "users", uid, "budgets");
  for (const budget of DEFAULT_BUDGETS) batch.set(doc(budgetsRef), budget);
  await batch.commit();
}

export function useBudgets(uid: string | undefined) {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    if (!uid) {
      setBudgets([]);
      return;
    }
    return onSnapshot(
      collection(db, "users", uid, "budgets"),
      (snapshot) => {
        setBudgets(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })) as Budget[],
        );
      },
      (error) => {
        if (error.code !== "permission-denied") {
          console.error(error);
        }
      },
    );
  }, [uid]);

  function addBudget(next: NewBudget) {
    if (!uid) return;
    addDoc(collection(db, "users", uid, "budgets"), next);
  }

  function updateBudget(id: string, patch: NewBudget) {
    if (!uid) return;
    // Drop month when switching to monthly — updateDoc won't clear it otherwise.
    updateDoc(doc(db, "users", uid, "budgets", id), {
      ...patch,
      ...(patch.cadence === "monthly" ? { month: deleteField() } : {}),
    });
  }

  async function deleteBudget(id: string) {
    if (!uid) return;
    const orphaned = await getDocs(
      query(
        collection(db, "users", uid, "transactions"),
        where("budgetId", "==", id),
      ),
    );
    const batch = writeBatch(db);
    orphaned.forEach((docSnap) => batch.update(docSnap.ref, { budgetId: deleteField() }));
    batch.delete(doc(db, "users", uid, "budgets", id));
    await batch.commit();
  }

  return { budgets, addBudget, updateBudget, deleteBudget };
}
