
'use server';

/**
 * @fileOverview A flow to retrieve all signup requests from Firestore.
 *
 * - getSignupRequests - A function that fetches all signup request records.
 * - SignupRequestRecord - The type for a single signup request record.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

const SignupRequestRecordSchema = z.object({
  id: z.string(),
  email: z.string(),
  timestamp: z.any(), // Firestore timestamp object
});

export type SignupRequestRecord = z.infer<typeof SignupRequestRecordSchema>;

const GetSignupRequestsOutputSchema = z.object({
    requests: z.array(SignupRequestRecordSchema)
});

// Helper function to initialize Firebase Admin SDK.
const getDb = () => {
  if (!getApps().length) {
    initializeApp({
      credential: credential.applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
  return getFirestore();
}

export async function getSignupRequests(): Promise<{ requests: SignupRequestRecord[] }> {
  return getSignupRequestsFlow();
}

const getSignupRequestsFlow = ai.defineFlow(
  {
    name: 'getSignupRequestsFlow',
    inputSchema: z.void(),
    outputSchema: GetSignupRequestsOutputSchema,
  },
  async () => {
    const db = getDb();
    const requestsSnapshot = await db.collection('signupRequests').orderBy('timestamp', 'desc').get();
    
    const requests: SignupRequestRecord[] = [];
    requestsSnapshot.forEach(doc => {
      const data = doc.data();
      const timestamp = data.timestamp.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString();
      requests.push({ id: doc.id, ...data, timestamp } as SignupRequestRecord);
    });

    return { requests };
  }
);
