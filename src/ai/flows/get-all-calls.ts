'use server';

/**
 * @fileOverview A flow to retrieve all call analysis records from Firestore.
 *
 * - getAllCalls - A function that fetches all call records.
 * - StoredCallRecord - The type for a single stored call record.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {service} from 'genkit';
import type {Timestamp} from 'firebase-admin/firestore';

// This schema should match the structure of what's saved in store-call-record.ts
const StoredCallRecordSchema = z.object({
  id: z.string(),
  userId: z.string(),
  universityName: z.string(),
  domain: z.string(),
  callDate: z.string(),
  fileName: z.string(),
  agentName: z.string(),
  applicantId: z.string(),
  transcript: z.string(),
  sentiment: z.string(),
  rubricScores: z.record(z.string(), z.number()),
  audioMetrics: z.string().optional(),
  timestamps: z
    .array(
      z.object({
        segment: z.string(),
        startTime: z.string(),
        endTime: z.string(),
      })
    )
    .optional(),
  analysis: z.object({
    agentBehaviorAssessment: z.string(),
    feedback: z.string(),
  }),
  coachingTips: z.array(z.string()),
  createdAt: z.any(), // Firestore timestamp object
});

export type StoredCallRecord = z.infer<typeof StoredCallRecordSchema>;

const GetAllCallsOutputSchema = z.object({
  calls: z.array(StoredCallRecordSchema),
});

export async function getAllCalls(): Promise<{calls: StoredCallRecord[]}> {
  return getAllCallsFlow();
}

const getAllCallsFlow = ai.defineFlow(
  {
    name: 'getAllCallsFlow',
    inputSchema: z.void(),
    outputSchema: GetAllCallsOutputSchema,
  },
  async () => {
    const db = service('firestore').db();
    const callsSnapshot = await db.collection('calls').get();

    const calls: StoredCallRecord[] = [];
    callsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Firestore Timestamps need to be converted
      const createdAt = (data.createdAt as Timestamp).toDate().toISOString();
      calls.push({id: doc.id, ...data, createdAt} as StoredCallRecord);
    });

    return {calls};
  }
);
