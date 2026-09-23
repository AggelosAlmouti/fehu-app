"use client";

import {
  createContext,
  useCallback,
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
  getAdditionalUserInfo,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { deleteAllUserData, seedNewUser } from "@/lib/firestore";
import { readStorage, writeStorage } from "@/lib/storage";

// Firebase Auth's session-restore has an unbounded network round-trip
// before the first onAuthStateChanged fires (see CLAUDE.md's Auth model).
// We remember the last confirmed user ourselves so the app can render
// optimistically while that's still in flight, instead of blocking on it.
type OptimisticUser = { uid: string; email: string | null };
const OPTIMISTIC_USER_KEY = "fehu-last-user";

function readOptimisticUser(): OptimisticUser | null {
  try {
    const parsed = JSON.parse(readStorage(OPTIMISTIC_USER_KEY) ?? "null");
    return typeof parsed?.uid === "string" ? parsed : null;
  } catch {
    return null;
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
      if (!firebaseUser) setOptimisticUser(null);
      writeStorage(
        OPTIMISTIC_USER_KEY,
        firebaseUser
          ? JSON.stringify({ uid: firebaseUser.uid, email: firebaseUser.email })
          : null,
      );
    });
  }, []);

  // Stable identity — the sign-in gate re-initializes Google's button whenever it changes.
  const signInWithGoogleCredential = useCallback(async (idToken: string) => {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    setUser(result.user);
    // isNewUser, not creationTime === lastSignInTime — see CLAUDE.md.
    if (getAdditionalUserInfo(result)?.isNewUser) {
      await seedNewUser(result.user.uid);
    }
  }, []);

  async function logOut() {
    await signOut(auth);
  }

  async function deleteAccount() {
    // Throw (not silently return) so DeleteAccountDialog's catch can
    // surface an error — reachable now during the optimistic-render window.
    if (!auth.currentUser) throw new Error("Not signed in yet");
    await deleteAllUserData(auth.currentUser.uid);
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
