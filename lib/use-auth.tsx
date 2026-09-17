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
import { seedDefaultBudgets } from "@/lib/use-budgets";
import { seedDefaultIncomeSources } from "@/lib/use-income-sources";

// Firebase Auth's session-restore has an unbounded network round-trip
// before the first onAuthStateChanged fires (see CLAUDE.md's Auth model).
// We remember the last confirmed user ourselves so the app can render
// optimistically while that's still in flight, instead of blocking on it.
type OptimisticUser = { uid: string; email: string | null };
const OPTIMISTIC_USER_KEY = "fehu-last-user";

function readOptimisticUser(): OptimisticUser | null {
  try {
    const raw = localStorage.getItem(OPTIMISTIC_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.uid === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function writeOptimisticUser(user: OptimisticUser | null) {
  try {
    if (user) {
      localStorage.setItem(OPTIMISTIC_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(OPTIMISTIC_USER_KEY);
    }
  } catch {
    // Best-effort — a private/restricted context just means no optimistic
    // render next time, not a functional problem now.
  }
}

type AuthContextValue = {
  user: User | null;
  // Real user once confirmed, or the remembered stand-in until then —
  // Firestore-backed hooks should key off this, not `user`.
  effectiveUser: OptimisticUser | null;
  // Whether there's a remembered prior session — lets AppShell render
  // optimistically instead of blank while `loading` is still true.
  hasPriorSession: boolean;
  loading: boolean;
  signInWithGoogleCredential: (idToken: string) => Promise<void>;
  logOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimisticUser, setOptimisticUser] = useState<OptimisticUser | null>(null);

  useEffect(() => {
    setOptimisticUser(readOptimisticUser());
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      writeOptimisticUser(
        firebaseUser
          ? { uid: firebaseUser.uid, email: firebaseUser.email }
          : null,
      );
    });
  }, []);

  async function signInWithGoogleCredential(idToken: string) {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    setUser(result.user);
    // creationTime === lastSignInTime only on the very first sign-in.
    const { creationTime, lastSignInTime } = result.user.metadata;
    if (creationTime === lastSignInTime) {
      await Promise.all([
        seedDefaultBudgets(result.user.uid),
        seedDefaultIncomeSources(result.user.uid),
      ]);
    }
  }

  async function logOut() {
    await signOut(auth);
  }

  async function deleteAccount() {
    // Throw (not silently return) so DeleteAccountDialog's catch can
    // surface an error — reachable now during the optimistic-render window.
    if (!auth.currentUser) throw new Error("Not signed in yet");
    // Must delete Firestore data while still authenticated.
    const uid = auth.currentUser.uid;
    const [transactionsSnapshot, budgetsSnapshot, incomeSourcesSnapshot] =
      await Promise.all([
        getDocs(collection(db, "users", uid, "transactions")),
        getDocs(collection(db, "users", uid, "budgets")),
        getDocs(collection(db, "users", uid, "incomeSources")),
      ]);
    const batch = writeBatch(db);
    transactionsSnapshot.forEach((doc) => batch.delete(doc.ref));
    budgetsSnapshot.forEach((doc) => batch.delete(doc.ref));
    incomeSourcesSnapshot.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    await deleteUser(auth.currentUser);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        effectiveUser: user ?? optimisticUser,
        hasPriorSession: optimisticUser !== null,
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
