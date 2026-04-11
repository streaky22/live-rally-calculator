import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Helper to ignore "TODO_" placeholders from the exported JSON
const getRealValue = (jsonVal: string | undefined, envVal: string | undefined) => {
  if (jsonVal && !jsonVal.includes('TODO') && jsonVal.trim() !== '') {
    return jsonVal;
  }
  return envVal || '';
};

const config = {
  apiKey: getRealValue(firebaseConfig.apiKey, import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: getRealValue(firebaseConfig.authDomain, import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: getRealValue(firebaseConfig.projectId, import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: getRealValue(firebaseConfig.storageBucket, import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: getRealValue(firebaseConfig.messagingSenderId, import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: getRealValue(firebaseConfig.appId, import.meta.env.VITE_FIREBASE_APP_ID),
  firestoreDatabaseId: getRealValue(firebaseConfig.firestoreDatabaseId, import.meta.env.VITE_FIRESTORE_DATABASE_ID)
};

const isValidConfig = !!config.apiKey && !!config.projectId;

let app: any = null;
let db: any = null;
let auth: any = null;
let googleProvider: any = null;
let secondaryApp: any = null;
let secondaryAuth: any = null;

try {
  if (isValidConfig) {
    app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    // Fallback to '(default)' if databaseId is empty to prevent crashes
    db = getFirestore(app, config.firestoreDatabaseId || '(default)');
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    
    secondaryApp = initializeApp(config, "Secondary");
    secondaryAuth = getAuth(secondaryApp);
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

export { db, auth, googleProvider, secondaryAuth };

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

