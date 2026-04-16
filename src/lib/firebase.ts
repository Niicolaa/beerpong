import { initializeApp } from 'firebase/app'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'placeholder',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'placeholder.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'placeholder',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'placeholder.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:000000000000:web:000000000000',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

enableIndexedDbPersistence(db).catch(() => {
  // Offline persistence not available (e.g. multiple tabs in private mode) — silently ignore
})

export default app
