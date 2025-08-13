
'use server';

/**
 * @fileOverview A flow to validate if a user is allowed to sign up.
 *
 * - validateUser - Checks if an email exists in the 'allowedUsers' collection.
 * - ValidateUserInput - The input type for the validateUser function.
 * - ValidateUserOutput - The return type for the validateUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

const ValidateUserInputSchema = z.object({
  email: z.string().email().describe('The email address to validate.'),
});
export type ValidateUserInput = z.infer<typeof ValidateUserInputSchema>;

const ValidateUserOutputSchema = z.object({
  isAllowed: z.boolean().describe('Whether the user is allowed to sign up.'),
  role: z.string().optional().describe('The role of the user if they are allowed.'),
});
export type ValidateUserOutput = z.infer<typeof ValidateUserOutputSchema>;


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

export async function validateUser(input: ValidateUserInput): Promise<ValidateUserOutput> {
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
    const userDoc = await allowedUsersCollection.doc(email.toLowerCase()).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      return {
        isAllowed: true,
        role: userData?.role || 'agent', // Default to 'agent' if role is not specified
      };
    }

    return {
      isAllowed: false,
    };
  }
);
