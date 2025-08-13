
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, credential } from 'firebase-admin/app';

const ValidateUserInputSchema = z.object({
  email: z.string().email(),
});

const ValidateUserOutputSchema = z.object({
  isValid: z.boolean(),
  userId: z.string().optional(),
});

// Helper function to initialize Firebase Admin SDK if not already done.
const getDb = () => {
  if (!getApps().length) {
    initializeApp({
      credential: credential.applicationDefault(),
    });
  }
  return getFirestore();
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
    const db = getDb();
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
