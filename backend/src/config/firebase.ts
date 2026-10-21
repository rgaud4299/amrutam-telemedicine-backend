import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

function getFirebaseCredentials(): ServiceAccount | null {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  let privateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  // Handle escaped newlines and wrapping quotes in private key
  privateKey = privateKey.replace(/\\n/g, '\n');
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }

  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

let firestoreInstance: Firestore | null = null;
let isInitialized = false;

// Initialize Firebase App
if (!getApps().length) {
  try {
    const serviceAccount = getFirebaseCredentials();

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.projectId,
      });
      isInitialized = true;
      console.log(`[Firebase] Admin SDK initialized successfully (Project: ${serviceAccount.projectId}).`);
    } else {
      console.warn(
        '[Firebase] Warning: Firebase credentials not found in .env. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
      );
    }
  } catch (error) {
    console.error('[Firebase] Failed to initialize Firebase Admin SDK:', error);
  }
} else {
  isInitialized = true;
}

export const getFirestoreDb = (): Firestore => {
  if (!isInitialized && !getApps().length) {
    throw new Error(
      '[Firebase] Firestore is not initialized. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file.'
    );
  }
  if (!firestoreInstance) {
    firestoreInstance = getFirestore();
  }
  return firestoreInstance;
};

export const isFirebaseReady = (): boolean => {
  return isInitialized || getApps().length > 0;
};

export const firestore: Firestore = new Proxy({} as Firestore, {
  get(_target, prop, receiver) {
    const db = getFirestoreDb();
    const value = Reflect.get(db, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(db);
    }
    return value;
  },
});
