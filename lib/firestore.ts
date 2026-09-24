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
  type WriteBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Budget,
  IncomeSource,
  NewBudget,
  NewIncomeSource,
  NewTransaction,
  Transaction,
} from "@/lib/data";

// Every per-user data collection. The Firebase-console security rules must
// cover each one (see CLAUDE.md's Auth model).
type UserCollection = "transactions" | "budgets" | "incomeSources";
const USER_COLLECTIONS: UserCollection[] = ["transactions", "budgets", "incomeSources"];

function userCollection(uid: string, name: UserCollection) {
  return collection(db, "users", uid, name);
}

function userDoc(uid: string, name: UserCollection, id: string) {
  return doc(db, "users", uid, name, id);
}

export function preferencesDoc(uid: string) {
  return doc(db, "users", uid, "settings", "preferences");
}

const DEFAULT_BUDGETS: NewBudget[] = [
  { name: "Groceries", amount: 300, cadence: "monthly" },
  { name: "Housing", amount: 800, cadence: "monthly" },
  { name: "Transportation", amount: 100, cadence: "monthly" },
  { name: "Coffee", amount: 30, cadence: "monthly" },
  { name: "Eating out", amount: 100, cadence: "monthly" },
];

const DEFAULT_INCOME_SOURCES: NewIncomeSource[] = [{ name: "Salary" }];

export async function seedNewUser(uid: string) {
  const batch = writeBatch(db);
  for (const budget of DEFAULT_BUDGETS) {
    batch.set(doc(userCollection(uid, "budgets")), budget);
  }
  for (const source of DEFAULT_INCOME_SOURCES) {
    batch.set(doc(userCollection(uid, "incomeSources")), source);
  }
  await batch.commit();
}

// Firestore rejects any batch over 500 writes, so large jobs are split.
const BATCH_LIMIT = 500;

async function commitInBatches(writes: ((batch: WriteBatch) => void)[]) {
  const commits = [];
  for (let i = 0; i < writes.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    writes.slice(i, i + BATCH_LIMIT).forEach((write) => write(batch));
    commits.push(batch.commit());
  }
  await Promise.all(commits);
}

async function collectionDeletes(uid: string) {
  const snapshots = await Promise.all(
    USER_COLLECTIONS.map((name) => getDocs(userCollection(uid, name))),
  );
  return snapshots.flatMap((snapshot) =>
    snapshot.docs.map((docSnap) => (batch: WriteBatch) => batch.delete(docSnap.ref)),
  );
}

// Must run while still authenticated, i.e. before deleting the Auth account.
export async function deleteAllUserData(uid: string) {
  const writes = await collectionDeletes(uid);
  writes.push((batch) => batch.delete(preferencesDoc(uid)));
  await commitInBatches(writes);
}

// Dev-only (Settings' test-data row): swaps the user's budgets, incomes and
// transactions for `data`, each item's id becoming its document id. Deletes
// finish first, so a rerun can't race a delete against a write of the same doc.
export async function replaceUserData(
  uid: string,
  data: { budgets: Budget[]; incomeSources: IncomeSource[]; transactions: Transaction[] },
) {
  await commitInBatches(await collectionDeletes(uid));
  await commitInBatches([
    ...data.budgets.map(({ id, ...budget }) => (batch: WriteBatch) =>
      batch.set(userDoc(uid, "budgets", id), budget)),
    ...data.incomeSources.map(({ id, ...source }) => (batch: WriteBatch) =>
      batch.set(userDoc(uid, "incomeSources", id), source)),
    ...data.transactions.map(({ id, ...transaction }) => (batch: WriteBatch) =>
      batch.set(userDoc(uid, "transactions", id), transaction)),
  ]);
}

function useUserCollection<T extends { id: string }>(
  uid: string | undefined,
  name: UserCollection,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let received = false;
    let fromCache = true;
    const unsubscribe = onSnapshot(
      userCollection(uid, name),
      { includeMetadataChanges: true },
      (snapshot) => {
        const firstSnapshot = !received;
        received = true;
        fromCache = snapshot.metadata.fromCache;
        if (firstSnapshot || snapshot.docChanges().length > 0) {
          setItems(
            snapshot.docs.map(
              (docSnap) => ({ id: docSnap.id, ...docSnap.data() }) as T,
            ),
          );
        }
        if (firstSnapshot || !fromCache) setLoading(false);
      },
      (error) => {
        setLoading(false);
        // Expected during sign-out; only log real errors.
        if (error.code !== "permission-denied") {
          console.error(error);
        }
      },
    );
    function handleOnline() {
      if (received && fromCache) setLoading(true);
    }
    window.addEventListener("online", handleOnline);
    return () => {
      unsubscribe();
      window.removeEventListener("online", handleOnline);
    };
  }, [uid, name]);

  return { items, loading };
}

// Deletes a budget/source and strips the now-dangling reference from every
// transaction pointing at it.
async function deleteAndUnlink(
  uid: string | undefined,
  name: "budgets" | "incomeSources",
  id: string,
  linkField: "budgetId" | "sourceId",
) {
  if (!uid) return;
  const orphaned = await getDocs(
    query(userCollection(uid, "transactions"), where(linkField, "==", id)),
  );
  const writes = orphaned.docs.map(
    (docSnap) => (batch: WriteBatch) =>
      batch.update(docSnap.ref, { [linkField]: deleteField() }),
  );
  writes.push((batch) => batch.delete(userDoc(uid, name, id)));
  await commitInBatches(writes);
}

export function useTransactions(uid: string | undefined) {
  const { items, loading } = useUserCollection<Transaction>(uid, "transactions");

  function addTransaction(next: NewTransaction) {
    if (!uid) return;
    addDoc(userCollection(uid, "transactions"), next);
  }

  function updateTransaction(id: string, patch: NewTransaction) {
    if (!uid) return;
    // Drop the other type's linking field — updateDoc won't clear it otherwise.
    updateDoc(userDoc(uid, "transactions", id), {
      ...patch,
      ...(patch.type === "income" ? { budgetId: deleteField() } : {}),
      ...(patch.type === "expense" ? { sourceId: deleteField() } : {}),
    });
  }

  function deleteTransaction(id: string) {
    if (!uid) return;
    deleteDoc(userDoc(uid, "transactions", id));
  }

  return {
    transactions: items,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

export function useBudgets(uid: string | undefined) {
  const { items, loading } = useUserCollection<Budget>(uid, "budgets");

  function addBudget(next: NewBudget) {
    if (!uid) return;
    addDoc(userCollection(uid, "budgets"), next);
  }

  function updateBudget(id: string, patch: NewBudget) {
    if (!uid) return;
    // Drop month when switching to monthly — updateDoc won't clear it otherwise.
    updateDoc(userDoc(uid, "budgets", id), {
      ...patch,
      ...(patch.cadence === "monthly" ? { month: deleteField() } : {}),
    });
  }

  function deleteBudget(id: string) {
    return deleteAndUnlink(uid, "budgets", id, "budgetId");
  }

  return { budgets: items, loading, addBudget, updateBudget, deleteBudget };
}

export function useIncomeSources(uid: string | undefined) {
  const { items, loading } = useUserCollection<IncomeSource>(uid, "incomeSources");

  function addIncomeSource(next: NewIncomeSource) {
    if (!uid) return;
    addDoc(userCollection(uid, "incomeSources"), next);
  }

  function updateIncomeSource(id: string, patch: NewIncomeSource) {
    if (!uid) return;
    updateDoc(userDoc(uid, "incomeSources", id), patch);
  }

  function deleteIncomeSource(id: string) {
    return deleteAndUnlink(uid, "incomeSources", id, "sourceId");
  }

  return {
    sources: items,
    loading,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
  };
}
