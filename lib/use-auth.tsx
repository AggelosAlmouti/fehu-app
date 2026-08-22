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
  signInWithRedirect,
  getRedirectResult,
  signOut,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();
// Always show the account chooser, rather than silently reusing whatever
// Google session already exists in the browser.
googleProvider.setCustomParameters({ prompt: "select_account" });

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Surface unexpected errors from a redirect round-trip in the console;
    // onAuthStateChanged below is what actually picks up the signed-in user.
    getRedirectResult(auth).catch((err) => {
      console.error(err);
    });

    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
  }, []);

  async function signInWithGoogle() {
    await signInWithRedirect(auth, googleProvider);
  }

  async function logOut() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
