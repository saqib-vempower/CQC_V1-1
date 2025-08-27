import * as admin from 'firebase-admin';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';

let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;
let initializationError: Error | null = null;

const isProduction = process.env.NODE_ENV === 'production';

try {
  if (admin.apps.length === 0) {
    if (isProduction) {
      // In production (deployed on Firebase), use automatic credentials
      admin.initializeApp();
      console.log('Firebase Admin SDK initialized using production automatic credentials.');
    } else {
      // In local development, use the service account file
      const privateKey = process.env.APP_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      if (!process.env.APP_FIREBASE_PROJECT_ID || !process.env.APP_FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error('Missing required Firebase Admin SDK credentials in .env.local for local development.');
      }
      const serviceAccount: admin.ServiceAccount = {
        projectId: process.env.APP_FIREBASE_PROJECT_ID,
        clientEmail: process.env.APP_FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      };
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized using local development credentials.');
    }
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
