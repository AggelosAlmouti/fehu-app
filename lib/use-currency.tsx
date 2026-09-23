"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onSnapshot, setDoc } from "firebase/firestore";
import { preferencesDoc } from "@/lib/firestore";
import { useAuth } from "@/lib/use-auth";
import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/data";

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const uid = useAuth().effectiveUser?.uid;
  const [currency, setCurrencyState] = useState<CurrencyCode>(DEFAULT_CURRENCY);

  useEffect(() => {
    if (!uid) {
      setCurrencyState(DEFAULT_CURRENCY);
      return;
    }
    return onSnapshot(
      preferencesDoc(uid),
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
  }, [uid]);

  function setCurrency(code: CurrencyCode) {
    if (!uid) return;
    setDoc(preferencesDoc(uid), { currency: code }, { merge: true });
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
