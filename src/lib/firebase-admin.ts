import * as admin from 'firebase-admin';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';

let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;
let initializationError: Error | null = null;

try {
  if (admin.apps.length === 0) {
    // This is the robust way: Always build credentials from environment variables.
    // This works for both local development (from .env.local) and production (from secrets).
    const privateKey = process.env.APP_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!process.env.APP_FIREBASE_PROJECT_ID || !process.env.APP_FIREBASE_CLIENT_EMAIL || !privateKey) {
      throw new Error('Missing required Firebase Admin SDK credentials. They must be set as environment variables.');
    }

    const serviceAccount: admin.ServiceAccount = {
      projectId: process.env.APP_FIREBASE_PROJECT_ID,
      clientEmail: process.env.APP_FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized using explicit credentials from environment variables.');
  }

  adminAuth = getAuth();
  adminDb = getFirestore();

} catch (error: any) {
  console.error('!!! FIREBASE ADMIN SDK INITIALIZATION FAILED !!!', error);
  initializationError = error;
  adminAuth = null;
  adminDb = null;
}

export { adminAuth, adminDb, initializationError };
