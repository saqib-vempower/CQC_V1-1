
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';

const CreateCustomTokenInputSchema = z.object({
  uid: z.string(),
});

const CreateCustomTokenOutputSchema = z.object({
  token: z.string(),
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
    const app = getAdminApp();
    const auth = getAuth(app);
    try {
        const customToken = await auth.createCustomToken(uid);
        return { token: customToken };
    } catch (error) {
        console.error("Error creating custom token:", error);
        throw new Error("Failed to create custom token.");
    }
  }
);
