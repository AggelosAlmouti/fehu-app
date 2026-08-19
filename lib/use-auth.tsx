"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { FirebaseError } from "firebase/app";
import {
  onAuthStateChanged,
  signInAnonymously,
  linkWithPopup,
  signInWithCredential,
  signOut,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const googleProvider = new GoogleAuthProvider();

type AuthContextValue = {
  user: User | null;
  isAnonymous: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        signInAnonymously(auth);
      }
    });
  }, []);

  async function signInWithGoogle() {
    if (!auth.currentUser) return;
    try {
      // Upgrade the current anonymous account to Google, keeping its uid
      // (and therefore all its expenses) intact.
      const result = await linkWithPopup(auth.currentUser, googleProvider);
      setUser(result.user);
    } catch (err) {
      if (
        err instanceof FirebaseError &&
        err.code === "auth/credential-already-in-use"
      ) {
        // This Google account is already linked to a different anonymous
        // session. We already completed Google's auth in the popup above —
        // the credential comes back attached to the error — so sign in
        // with it directly instead of opening a second popup (which Chrome
        // blocks, since it's no longer a fresh user click). Anything
        // recorded on this device before now stays under the old anonymous
        // id and won't carry over.
        const credential = GoogleAuthProvider.credentialFromError(err);
        if (credential) {
          const result = await signInWithCredential(auth, credential);
          setUser(result.user);
        }
      } else {
        throw err;
      }
    }
  }

  async function logOut() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAnonymous: user?.isAnonymous ?? true,
        signInWithGoogle,
        logOut,
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
