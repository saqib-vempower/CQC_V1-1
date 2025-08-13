
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
    if (getApps().length) {
        return getApps()[0]!;
    }
     // In a deployed environment, GOOGLE_CREDENTIALS should be set.
    if (process.env.GOOGLE_CREDENTIALS) {
        const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        return initializeApp({
            credential: credential.cert(serviceAccount),
        });
    }
    // Fallback for local development or environments without the variable set.
    return initializeApp();
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
    const allowedUsersCollection = db.collection('allowedUsers');
    const userDoc = await allowedUsersCollection.doc(email).get();

    if (userDoc.exists) {
        // The user ID is the email itself for custom token generation
        return { isValid: true, userId: email };
    } else {
        return { isValid: false };
    }
  }
);
