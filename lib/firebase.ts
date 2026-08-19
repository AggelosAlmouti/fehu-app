import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Next.js hot-reloads modules in dev, which would call initializeApp() twice
// and crash — reuse the existing app instance if one already exists.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)

// persistentLocalCache turns on offline support: writes are cached in the
// browser (IndexedDB) and synced to Firestore when back online.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})
