
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';

const ValidateUserInputSchema = z.object({
  email: z.string().email(),
});

const ValidateUserOutputSchema = z.object({
  isValid: z.boolean(),
  userId: z.string().optional(),
});

// Helper function to initialize Firebase Admin SDK if not already done.
const getAdminApp = (): App => {
    const apps = getApps();
    if (apps.length) {
        return apps[0]!;
    }

    const serviceAccountStr = process.env.GOOGLE_CREDENTIALS;
    if (!serviceAccountStr) {
        throw new Error('GOOGLE_CREDENTIALS environment variable is not set.');
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountStr);
        return initializeApp({
            credential: credential.cert(serviceAccount),
        });
    } catch (e) {
        console.error("Failed to parse GOOGLE_CREDENTIALS:", e);
        throw new Error("Could not initialize Firebase Admin SDK.");
    }
};


export async function validateUser(input: z.infer<typeof ValidateUserInputSchema>): Promise<z.infer<typeof ValidateUserOutputSchema>> {
    return validateUserFlow(input);
}

const validateUserFlow = ai.defineFlow(
  {
    name: 'validateUserFlow',
    inputSchema: ValidateUserInputSchema,
    outputSchema: ValidateUserOutputSchema,
  },
  async ({ email }) => {
    const app = getAdminApp();
    const db = getFirestore(app);
    const allowedUsersCollection = db.collection('AllowedUsers');
    const userDoc = await allowedUsersCollection.doc(email).get();

    if (userDoc.exists) {
        // The user ID is the email itself for custom token generation
        return { isValid: true, userId: email };
    } else {
        return { isValid: false };
    }
  }
);
