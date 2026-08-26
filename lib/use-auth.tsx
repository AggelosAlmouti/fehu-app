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
    // Delete Firestore data first, while still authenticated — Firestore's
    // security rules require request.auth.uid == userId, so this has to
    // happen before the account itself is gone.
    const expensesSnapshot = await getDocs(
      collection(db, "users", auth.currentUser.uid, "expenses"),
    );
    const batch = writeBatch(db);
    expensesSnapshot.forEach((doc) => batch.delete(doc.ref));
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
