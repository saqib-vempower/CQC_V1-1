
'use server';

/**
 * @fileOverview A flow to store call analysis records in Firestore.
 *
 * - storeCallRecord - A function that handles saving the call data.
 * - StoreCallRecordInput - The input type for the storeCallRecord function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';

const StoreCallRecordInputSchema = z.object({
  userId: z.string().describe('The ID of the user who performed the analysis.'),
  universityName: z.string().describe('The name of the university.'),
  domain: z.string().describe('The domain of the call (e.g., Support, Reach).'),
  callDate: z.string().describe('The date of the call.'),
  fileName: z.string().describe('The name of the audio file.'),
  agentName: z.string().describe('The name of the agent.'),
  applicantId: z.string().describe('The ID of the applicant.'),
  transcript: z.string().describe('The full transcript of the call.'),
  sentiment: z.string().describe('The overall sentiment of the call.'),
  rubricScores: z.record(z.string(), z.number()).describe('The scores from the rubric.'),
  audioMetrics: z.string().optional().describe('Notes on audio metrics.'),
  timestamps: z.array(z.object({
    segment: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })).optional().describe('Notable timestamps in the call.'),
  analysis: z.object({
    agentBehaviorAssessment: z.string(),
    feedback: z.string(),
  }).describe('The AI-generated analysis of the call.'),
  coachingTips: z.array(z.string()).describe('The AI-generated coaching tips.'),
});

export type StoreCallRecordInput = z.infer<typeof StoreCallRecordInputSchema>;

// Helper function to initialize Firebase Admin SDK.
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

export async function storeCallRecord(input: StoreCallRecordInput): Promise<{ id: string }> {
  return storeCallRecordFlow(input);
}

const storeCallRecordFlow = ai.defineFlow(
  {
    name: 'storeCallRecordFlow',
    inputSchema: StoreCallRecordInputSchema,
    outputSchema: z.object({ id: z.string() }),
  },
  async (data) => {
    const app = getAdminApp();
    const db = getFirestore(app);
    const callRecord = {
      ...data,
      createdAt: new Date(),
    };
    const docRef = await db.collection('calls').add(callRecord);
    return { id: docRef.id };
  }
);
