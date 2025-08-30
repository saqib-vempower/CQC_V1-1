// src/lib/firebase-client.ts
import { getApp, getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Import getStorage

// This function safely initializes Firebase, either on the server or the client.
function initializeFirebaseApp(): FirebaseApp {
  const apps = getApps();
  if (apps.length) {
    return getApp();
  }

  // When running in the Firebase App Hosting build environment, this variable will be available.
  const firebaseConfigString = process.env.FIREBASE_WEBAPP_CONFIG;

  if (firebaseConfigString) {
    const firebaseConfig = JSON.parse(firebaseConfigString);
    return initializeApp(firebaseConfig);
  }

  // Fallback for client-side execution where the above variable isn't available.
  const clientSideConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  return initializeApp(clientSideConfig);
}

const app = initializeFirebaseApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // Export the storage service
