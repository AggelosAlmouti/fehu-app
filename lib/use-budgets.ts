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
};

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
    updateDoc(doc(db, "users", uid, "budgets", id), patch);
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
