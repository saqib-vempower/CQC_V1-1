// src/lib/firebase-admin.ts
import 'server-only';
import { getApps, getApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// In Google environments (Firebase App Hosting, Cloud Run, Cloud Functions),
// initializeApp() with no args uses Application Default Credentials automatically.
const app = getApps().length ? getApp() : initializeApp();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
