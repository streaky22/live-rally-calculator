import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Use import.meta.glob to optionally import the config file without breaking the build if it's missing (e.g., in Vercel)
const configFiles = import.meta.glob('../firebase-applet-config.json', { eager: true });
const firebaseConfig: any = configFiles['../firebase-applet-config.json'] || {};
const configData = firebaseConfig.default || firebaseConfig;

// Helper to ignore "TODO_" placeholders from the exported JSON
const getRealValue = (jsonVal: string | undefined, envVal: string | undefined) => {
  if (jsonVal && !jsonVal.includes('TODO') && jsonVal.trim() !== '') {
    return jsonVal;
  }
  return envVal || '';
};

const config = {
  apiKey: getRealValue(configData.apiKey, import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: getRealValue(configData.authDomain, import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: getRealValue(configData.projectId, import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: getRealValue(configData.storageBucket, import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: getRealValue(configData.messagingSenderId, import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: getRealValue(configData.appId, import.meta.env.VITE_FIREBASE_APP_ID),
  firestoreDatabaseId: getRealValue(configData.firestoreDatabaseId, import.meta.env.VITE_FIRESTORE_DATABASE_ID)
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
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Restrict Google Login to the owner
    if (user.email?.toLowerCase() !== 'antoniojosealiagamolina@gmail.com') {
      await signOut(auth);
      throw new Error("Access denied. Only the owner can use Google login.");
    }
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
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

