import admin from 'firebase-admin';

let adminAuth: admin.auth.Auth;
let adminDb: admin.firestore.Firestore;
let initializationError: Error | null = null;

try {
  const base64Credentials = process.env.FIREBASE_ADMIN_SDK_BASE64;

  if (!base64Credentials) {
    throw new Error('FIREBASE_ADMIN_SDK_BASE64 is not set in .env.local');
  }

  // Decode the Base64 string back into the JSON credentials
  const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const serviceAccount = JSON.parse(decodedCredentials);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  adminAuth = admin.auth();
  adminDb = admin.firestore();

} catch (error: any) {
  console.error('!!! FIREBASE ADMIN SDK INITIALIZATION FAILED !!!', error);
  initializationError = error;
  // @ts-ignore
  adminAuth = null;
  // @ts-ignore
  adminDb = null;
}

export { adminAuth, adminDb, initializationError };
