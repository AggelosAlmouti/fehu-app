"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Transaction } from "@/lib/data";

export type NewTransaction =
  | {
      type: "expense";
      title: string;
      amount: number;
      date: string;
      budgetId?: string;
    }
  | { type: "income"; title: string; amount: number; date: string };

const COLLECTION = "transactions";

export function useTransactions(uid: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!uid) {
      setTransactions([]);
      return;
    }
    const transactionsQuery = query(
      collection(db, "users", uid, COLLECTION),
      orderBy("date", "desc"),
    );
    return onSnapshot(
      transactionsQuery,
      (snapshot) => {
        setTransactions(
          snapshot.docs.map(
            (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as Transaction,
          ),
        );
      },
      (error) => {
        // Expected during sign-out; only log real errors.
        if (error.code !== "permission-denied") {
          console.error(error);
        }
      },
    );
  }, [uid]);

  function addTransaction(next: NewTransaction) {
    if (!uid) return;
    addDoc(collection(db, "users", uid, COLLECTION), next);
  }

  function updateTransaction(id: string, patch: NewTransaction) {
    if (!uid) return;
    // Drop budgetId when switching to income — updateDoc won't clear it otherwise.
    updateDoc(doc(db, "users", uid, COLLECTION, id), {
      ...patch,
      ...(patch.type === "income" ? { budgetId: deleteField() } : {}),
    });
  }

  function deleteTransaction(id: string) {
    if (!uid) return;
    deleteDoc(doc(db, "users", uid, COLLECTION, id));
  }

  return { transactions, addTransaction, updateTransaction, deleteTransaction };
}
