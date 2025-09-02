// src/lib/firebase-client.ts
import { getApp, getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
}

let services: FirebaseServices | null = null;

export function getFirebaseServices(): FirebaseServices {
  if (services) {
    return services;
  }

  let app: FirebaseApp;
  if (!getApps().length) {
    const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG;
    if (firebaseConfigString) {
      const firebaseConfig = JSON.parse(firebaseConfigString);
      app = initializeApp(firebaseConfig);
    } else {
      const clientSideConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };
      app = initializeApp(clientSideConfig);
    }
  } else {
    app = getApp();
  }

  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  }

  services = { app, auth, db, storage };
  return services;
}
