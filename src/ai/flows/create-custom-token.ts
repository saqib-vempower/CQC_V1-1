
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

const CreateCustomTokenInputSchema = z.object({
  uid: z.string(),
});

const CreateCustomTokenOutputSchema = z.object({
  token: z.string(),
});

const getAdminAuth = () => {
  if (!getApps().length) {
    initializeApp({
      credential: credential.applicationDefault(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
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
