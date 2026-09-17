"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
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
import type { IncomeSource } from "@/lib/data";

export type NewIncomeSource = {
  name: string;
};

export const DEFAULT_INCOME_SOURCES: NewIncomeSource[] = [{ name: "Salary" }];

export async function seedDefaultIncomeSources(uid: string) {
  const batch = writeBatch(db);
  const sourcesRef = collection(db, "users", uid, "incomeSources");
  for (const source of DEFAULT_INCOME_SOURCES) batch.set(doc(sourcesRef), source);
  await batch.commit();
}

export function useIncomeSources(uid: string | undefined) {
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setSources([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "users", uid, "incomeSources"),
      (snapshot) => {
        setSources(
          snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          })) as IncomeSource[],
        );
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        if (error.code !== "permission-denied") {
          console.error(error);
        }
      },
    );
    function handleOnline() {
      setLoading(true);
    }
    window.addEventListener("online", handleOnline);
    return () => {
      unsubscribe();
      window.removeEventListener("online", handleOnline);
    };
  }, [uid]);

  function addIncomeSource(next: NewIncomeSource) {
    if (!uid) return;
    addDoc(collection(db, "users", uid, "incomeSources"), next);
  }

  function updateIncomeSource(id: string, patch: NewIncomeSource) {
    if (!uid) return;
    updateDoc(doc(db, "users", uid, "incomeSources", id), patch);
  }

  async function deleteIncomeSource(id: string) {
    if (!uid) return;
    const orphaned = await getDocs(
      query(
        collection(db, "users", uid, "transactions"),
        where("sourceId", "==", id),
      ),
    );
    const batch = writeBatch(db);
    orphaned.forEach((docSnap) =>
      batch.update(docSnap.ref, { sourceId: deleteField() }),
    );
    batch.delete(doc(db, "users", uid, "incomeSources", id));
    await batch.commit();
  }

  return {
    sources,
    loading,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
  };
}
