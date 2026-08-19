"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CategoryId, Expense } from "@/lib/data";

export type NewExpense = {
  title: string;
  amount: number;
  category: CategoryId;
};

export function useExpenses(uid: string | undefined) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!uid) return;
    const expensesQuery = query(
      collection(db, "users", uid, "expenses"),
      orderBy("date", "desc"),
    );
    return onSnapshot(
      expensesQuery,
      (snapshot) => {
        setExpenses(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Expense,
          ),
        );
      },
      (error) => {
        // Expected during sign-out: the listener briefly rejects as the uid
        // changes underneath it, then gets replaced by a fresh one for the
        // new uid. Only log genuinely unexpected errors.
        if (error.code !== "permission-denied") {
          console.error(error);
        }
      },
    );
  }, [uid]);

  function addExpense(next: NewExpense) {
    if (!uid) return;
    addDoc(collection(db, "users", uid, "expenses"), {
      ...next,
      date: new Date().toISOString().slice(0, 10),
    });
  }

  return { expenses, addExpense };
}
