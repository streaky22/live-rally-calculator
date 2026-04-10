import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Fallback to environment variables if JSON is empty or missing keys
const config = {
  apiKey: firebaseConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || import.meta.env.VITE_FIRESTORE_DATABASE_ID
};

const isValidConfig = !!config.apiKey && !!config.projectId;

const app = isValidConfig && getApps().length === 0 ? initializeApp(config) : getApps()[0];
export const db = isValidConfig ? getFirestore(app, config.firestoreDatabaseId) : null as any;
export const auth = isValidConfig ? getAuth(app) : null as any;
export const googleProvider = isValidConfig ? new GoogleAuthProvider() : null as any;

// Secondary app for creating users without logging out the current admin
const secondaryApp = isValidConfig ? initializeApp(config, "Secondary") : null as any;
export const secondaryAuth = isValidConfig ? getAuth(secondaryApp) : null as any;

export const signInWithGoogle = async () => {
  if (!auth) return;
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google", error);
  }
};

export const logOut = async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export { signInWithEmailAndPassword, createUserWithEmailAndPassword };

