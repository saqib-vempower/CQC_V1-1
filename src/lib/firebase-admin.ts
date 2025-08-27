import * as admin from 'firebase-admin';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';

let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;
let initializationError: Error | null = null;

try {
  const privateKey = process.env.APP_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!process.env.APP_FIREBASE_PROJECT_ID) {
    throw new Error('APP_FIREBASE_PROJECT_ID environment variable is not set.');
  }
  if (!process.env.APP_FIREBASE_CLIENT_EMAIL) {
    throw new Error('APP_FIREBASE_CLIENT_EMAIL environment variable is not set.');
  }
  if (!privateKey) {
    throw new Error('APP_FIREBASE_PRIVATE_KEY environment variable is not set.');
  }

  const serviceAccount: admin.ServiceAccount = {
    projectId: process.env.APP_FIREBASE_PROJECT_ID,
    clientEmail: process.env.APP_FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  };

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  adminAuth = getAuth();
  adminDb = getFirestore();
  console.log('Firebase Admin SDK initialized successfully.');

} catch (error: any) {
  console.error('!!! FIREBASE ADMIN SDK INITIALIZATION FAILED !!!', error);
  initializationError = error;
  adminAuth = null;
  adminDb = null;
}

export { adminAuth, adminDb, initializationError };
