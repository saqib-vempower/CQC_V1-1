
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, credential } from 'firebase-admin/app';

const CreateCustomTokenInputSchema = z.object({
  uid: z.string(),
});

const CreateCustomTokenOutputSchema = z.object({
  token: z.string(),
});

// Helper function to initialize Firebase Admin SDK if not already done.
const getAdminAuth = () => {
  if (!getApps().length) {
    initializeApp({
      credential: credential.applicationDefault(),
    });
  }
  return getAuth();
}

export async function createCustomToken(input: z.infer<typeof CreateCustomTokenInputSchema>): Promise<z.infer<typeof CreateCustomTokenOutputSchema>> {
    return createCustomTokenFlow(input);
}

const createCustomTokenFlow = ai.defineFlow(
  {
    name: 'createCustomTokenFlow',
    inputSchema: CreateCustomTokenInputSchema,
    outputSchema: CreateCustomTokenOutputSchema,
  },
  async ({ uid }) => {
    const auth = getAdminAuth();
    try {
        const customToken = await auth.createCustomToken(uid);
        return { token: customToken };
    } catch (error) {
        console.error("Error creating custom token:", error);
        throw new Error("Failed to create custom token.");
    }
  }
);
