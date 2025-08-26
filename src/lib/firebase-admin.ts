import admin from 'firebase-admin';

let adminAuth: admin.auth.Auth;
let adminDb: admin.firestore.Firestore;
let initializationError: Error | null = null;

try {
  // Read the service account details from individual environment variables
  const projectId = process.env.APP_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.APP_FIREBASE_CLIENT_EMAIL;
  // Replace the literal `\n` characters with actual newlines
  const privateKey = process.env.APP_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Server configuration error: APP_FIREBASE_PROJECT_ID, APP_FIREBASE_CLIENT_EMAIL, and APP_FIREBASE_PRIVATE_KEY must be set in .env.local');
  }

  const serviceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  if (!admin.apps.length) {
    admin.initializeApp({
      // Use the constructed credential object
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
