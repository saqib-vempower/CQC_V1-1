
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
