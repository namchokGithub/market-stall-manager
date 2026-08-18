import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
// ignoreUndefinedProperties: MarketLayout/Stall both have optional fields
// (backgroundImageUrl, status/category/renterName/contact/label). Without
// this, setDoc() throws synchronously the moment any of those is set to
// `undefined` rather than omitted, which is easy to do accidentally when
// clearing a field via `value || undefined`. This must be the app's first
// Firestore-instance call.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true })
