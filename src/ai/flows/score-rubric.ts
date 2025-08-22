'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { geminiPro } from '@genkit-ai/googleai';

const ScoreRubricInputSchema = z.object({
  transcript: z.string().describe('The transcript of the call to be scored.'),
});

const criterionSchema = z.object({
  criterion: z.string(),
  score: z.union([z.number().min(0).max(5), z.literal('N/A')]),
  weight: z.number(),
  evidence: z.string(),
  timestamp: z.number(),
  notes: z.string(),
});

const ScoreRubricOutputSchema = z.object({
  rubricVersion: z.string(),
  overallScore: z.number(),
  criteria: z.array(criterionSchema),
});

const rubric = [
    { criterion: 'C1: Greeting and Rapport Building', weight: 10 },
    { criterion: 'C2: Effective Questioning', weight: 15 },
    { criterion: 'C3: Active Listening', weight: 15 },
    { criterion: 'C4: Information Provision', weight: 10 },
    { criterion: 'C5: Tone and Empathy', weight: 10 },
    { criterion: 'C6: Problem Solving', weight: 15 },
    { criterion: 'C7: Process Adherence', weight: 5 },
    { criterion: 'C8: Professionalism', weight: 5 },
    { criterion: 'C9: Call Control', weight: 5 },
    { criterion: 'C10: Closing', weight: 10 },
];

const scoringPrompt = `You are an expert call quality analyst. Your task is to score a call transcript against a predefined rubric.
The rubric has 10 criteria (C1-C10). For each criterion, you must provide a score from 0 to 5, where 0 is poor and 5 is excellent.
If a criterion is not applicable to the call, you can mark it as 'N/A'.
For each criterion, you must also provide:
- A snippet of evidence from the transcript that justifies the score.
- The start timestamp of the evidence snippet.
- A short note explaining your reasoning.

Here is the transcript to analyze:
{{transcript}}

Please provide your scores in the required JSON format.
`;

export const scoreRubricFlow = ai.defineFlow(
  {
    name: 'scoreRubricFlow',
    inputSchema: ScoreRubricInputSchema,
    outputSchema: ScoreRubricOutputSchema,
    model: geminiPro,
    prompt: scoringPrompt,
    // @ts-ignore
    output: {
        schema: ScoreRubricOutputSchema,
    }
  },
  async (input) => {
    // This function is defined for type-safety and intellisense
    // The actual implementation is handled by the Genkit flow runtime
    // based on the provided prompt and model.
    return {
        rubricVersion: '1.0',
        overallScore: 0,
        criteria: [],
    };
  }
);
