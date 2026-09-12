"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/use-auth";
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/currencies";

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { effectiveUser } = useAuth();
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);

  useEffect(() => {
    if (!effectiveUser) {
      setCurrencyState(DEFAULT_CURRENCY);
      return;
    }
    return onSnapshot(
      doc(db, "users", effectiveUser.uid, "settings", "preferences"),
      (snap) => {
        const value = snap.data()?.currency;
        setCurrencyState(isCurrencyCode(value) ? value : DEFAULT_CURRENCY);
      },
      (error) => {
        if (error.code !== "permission-denied") {
          console.error(error);
        }
      },
    );
  }, [effectiveUser]);

  function setCurrency(code: CurrencyCode) {
    if (!effectiveUser) return;
    setDoc(
      doc(db, "users", effectiveUser.uid, "settings", "preferences"),
      { currency: code },
      { merge: true },
    );
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
