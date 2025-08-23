
'use server';
/**
 * @fileOverview A multi-step flow to analyze a call recording.
 * It transcribes the audio, calculates metrics, and scores it against a rubric.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { transcriptFlow, TranscriptFlowInput, TranscriptFlowOutput } from './transcript-flow';
import { scoreFlow, ScoreFlowInput, ScoreFlowOutput } from './score-flow';

export const AnalyzeCallInputSchema = z.object({
  audioGcsUri: z.string().describe('The Google Cloud Storage URI of the audio file.'),
  agentId: z.string().describe('The ID of the agent on the call.'),
  university: z.string().describe('The university associated with the call.'),
  domain: z.string().describe('The academic domain of the call (e.g., Admissions, Financial Aid).'),
  callType: z.string().describe('The type of call (e.g., Inbound, Outbound).'),
});
export type AnalyzeCallInput = z.infer<typeof AnalyzeCallInputSchema>;

export const AnalyzeCallOutputSchema = z.object({
  score: ScoreFlowOutput,
  talkTime: z.object({
    agent: z.number(),
    prospect: z.number(),
    total: z.number(),
  }),
  silence: z.object({
      total: z.number()
  }),
  overlap: z.object({
      total: z.number()
  }),
  transcript: TranscriptFlowOutput,
});
export type AnalyzeCallOutput = z.infer<typeof AnalyzeCallOutputSchema>;

// This is the main exported function that clients will call.
export async function analyzeCallFlow(input: AnalyzeCallInput): Promise<AnalyzeCallOutput> {
  return callAnalysisFlow(input);
}

const callAnalysisFlow = ai.defineFlow(
  {
    name: 'callAnalysisFlow',
    inputSchema: AnalyzeCallInputSchema,
    outputSchema: AnalyzeCallOutputSchema,
  },
  async (input) => {
    // Step 1: Transcribe the audio
    const transcriptInput: TranscriptFlowInput = { audioGcsUri: input.audioGcsUri };
    const transcript = await transcriptFlow(transcriptInput);

    // Step 2: Score the transcript
    const scoreInput: ScoreFlowInput = {
      transcript: transcript.map(t => `Speaker ${t.speaker} at ${t.start.toFixed(1)}s: ${t.text}`).join('\n')
    };
    const score = await scoreFlow(scoreInput);

    // Step 3: Calculate metrics from the transcript
    let agentTalkTime = 0;
    let prospectTalkTime = 0;
    let silence = 0;
    let overlap = 0;
    
    // Basic talk time calculation
    transcript.forEach(utterance => {
        const duration = utterance.end - utterance.start;
        if (utterance.speaker === 'A') { // Assuming Speaker A is the agent
            agentTalkTime += duration;
        } else {
            prospectTalkTime += duration;
        }
    });

    // Basic silence and overlap calculation (can be improved)
    for (let i = 1; i < transcript.length; i++) {
        const previous = transcript[i-1];
        const current = transcript[i];

        const gap = current.start - previous.end;
        if (gap > 0.5) { // Gaps longer than 0.5s are considered silence
            silence += gap;
        } else if (gap < 0) { // Negative gap means overlap
            overlap += Math.abs(gap);
        }
    }


    // Step 4: Assemble the final output
    return {
      score,
      talkTime: {
        agent: agentTalkTime,
        prospect: prospectTalkTime,
        total: agentTalkTime + prospectTalkTime,
      },
      silence: { total: silence },
      overlap: { total: overlap },
      transcript: transcript,
    };
  }
);
