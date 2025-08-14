'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {getAuth} from 'firebase-admin/auth';
import {initializeApp, getApps} from 'firebase-admin/app';

const CreateCustomTokenInputSchema = z.object({
  uid: z.string(),
});

const CreateCustomTokenOutputSchema = z.object({
  token: z.string(),
});

// Initialize Firebase Admin SDK if it hasn't been already.
// This is still needed for getAuth(), as it's not part of the genkit service connector.
if (!getApps().length) {
  initializeApp();
}

export async function createCustomToken(
  input: z.infer<typeof CreateCustomTokenInputSchema>
): Promise<z.infer<typeof CreateCustomTokenOutputSchema>> {
  return createCustomTokenFlow(input);
}

const createCustomTokenFlow = ai.defineFlow(
  {
    name: 'createCustomTokenFlow',
    inputSchema: CreateCustomTokenInputSchema,
    outputSchema: CreateCustomTokenOutputSchema,
  },
  async ({uid}) => {
    const auth = getAuth();
    try {
      const customToken = await auth.createCustomToken(uid);
      return {token: customToken};
    } catch (error) {
      console.error('Error creating custom token:', error);
      throw new Error('Failed to create custom token.');
    }
  }
);
