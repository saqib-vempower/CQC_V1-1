'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const UtteranceSchema = z.object({
  speaker: z.string(),
  text: z.string(),
  start: z.number(),
  end: z.number(),
});

const AnalyzeCallTranscriptInputSchema = z.object({
  utterances: z.array(UtteranceSchema),
});

const AnalyzeCallTranscriptOutputSchema = z.object({
  talkTime: z.object({ agent: z.number(), applicant: z.number() }),
  responseGaps: z.number(),
  holds: z.number(),
  overlaps: z.number(),
  politeClarifications: z.number(),
  namePronunciationAsked: z.boolean(),
});

const politeClarificationPhrases = [
    "could you repeat that",
    "say that again",
    "pardon me",
    "i didn't catch that"
];

const namePronunciationPhrases = [
    "how do you pronounce that",
    "pronounce your name",
    "say your name for me"
];

export const analyzeCallTranscriptFlow = ai.defineFlow(
  {
    name: 'analyzeCallTranscriptFlow',
    inputSchema: AnalyzeCallTranscriptInputSchema,
    outputSchema: AnalyzeCallTranscriptOutputSchema,
  },
  async ({ utterances }) => {
    let agentTalkTime = 0;
    let applicantTalkTime = 0;
    let responseGaps = 0;
    let overlaps = 0;
    let politeClarifications = 0;
    let namePronunciationAsked = false;

    // Sort utterances by start time to ensure correct order
    const sortedUtterances = utterances.sort((a, b) => a.start - b.start);

    for (let i = 0; i < sortedUtterances.length; i++) {
        const current = sortedUtterances[i];
        
        // Calculate talk time
        const duration = current.end - current.start;
        if (current.speaker === 'A') {
            agentTalkTime += duration;
        } else if (current.speaker === 'B') {
            applicantTalkTime += duration;
        }

        // Check for polite clarifications and name pronunciation
        const lowerCaseText = current.text.toLowerCase();
        if (politeClarificationPhrases.some(phrase => lowerCaseText.includes(phrase))) {
            politeClarifications++;
        }
        if (namePronunciationPhrases.some(phrase => lowerCaseText.includes(phrase))) {
            namePronunciationAsked = true;
        }

        if (i > 0) {
            const previous = sortedUtterances[i-1];

            // Check for response gaps
            if (current.speaker !== previous.speaker) {
                const gap = current.start - previous.end;
                if (gap > 2000) { // More than 2 seconds
                    responseGaps++;
                }
            }

            // Check for overlaps
            if (current.start < previous.end) {
                overlaps++;
            }
        }
    }

    return {
      talkTime: { agent: agentTalkTime / 1000, applicant: applicantTalkTime / 1000 }, // in seconds
      responseGaps,
      holds: 0, // Placeholder for now
      overlaps,
      politeClarifications,
      namePronunciationAsked,
    };
  }
);
