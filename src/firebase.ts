import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateEmail as authUpdateEmail,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { FirestoreErrorInfo, OperationType } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyBybnm71hXP_lGMsayGjENtiRuN7cqJdww",
  authDomain: "expense-tracker-pro-1d334.firebaseapp.com",
  projectId: "expense-tracker-pro-1d334",
  storageBucket: "expense-tracker-pro-1d334.firebasestorage.app",
  messagingSenderId: "746519270488",
  appId: "1:746519270488:web:65b47e6ec0aee81bf6e62d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore persistence failed-precondition: multiple tabs open.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore persistence unimplemented: browser unsupported.");
    }
  });
} catch (e) {
  console.warn("Offline persistence initialization warning: ", e);
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  authUpdateEmail,
  sendPasswordResetEmail,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  orderBy,
  deleteDoc
};
export type { User };
