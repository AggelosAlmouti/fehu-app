import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Dev hot-reload would call initializeApp() twice and crash otherwise.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth() (not getAuth()) to omit popupRedirectResolver — this app
// never uses popup/redirect sign-in, and getAuth()'s default resolver
// proactively loads an unused Google iframe helper on mobile/Safari (see
// CLAUDE.md's Auth model). Falls back to getAuth() on dev hot-reload, since
// Auth can't be initialized twice — it just returns the existing instance.
export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
      ],
    });
  } catch {
    return getAuth(app);
  }
})();

// Offline support: writes cache locally and sync when back online.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
