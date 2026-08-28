"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  deleteUser,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { collection, getDocs, writeBatch } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogleCredential: (idToken: string) => Promise<void>;
  logOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
  }, []);

  async function signInWithGoogleCredential(idToken: string) {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    setUser(result.user);
  }

  async function logOut() {
    await signOut(auth);
  }

  async function deleteAccount() {
    if (!auth.currentUser) return;
    // Must delete Firestore data while still authenticated.
    const uid = auth.currentUser.uid;
    const [transactionsSnapshot, budgetsSnapshot] = await Promise.all([
      getDocs(collection(db, "users", uid, "transactions")),
      getDocs(collection(db, "users", uid, "budgets")),
    ]);
    const batch = writeBatch(db);
    transactionsSnapshot.forEach((doc) => batch.delete(doc.ref));
    budgetsSnapshot.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    await deleteUser(auth.currentUser);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogleCredential,
        logOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
