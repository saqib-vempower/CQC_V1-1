// This is a server-side file.
'use server';

/**
 * @fileOverview Generates coaching tips based on rubric scores and timestamps of notable audio segments.
 *
 * - generateCoachingTips - A function that generates coaching tips.
 * - GenerateCoachingTipsInput - The input type for the generateCoachingTips function.
 * - GenerateCoachingTipsOutput - The return type for the generateCoachingTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCoachingTipsInputSchema = z.object({
  rubricScores: z.record(z.string(), z.number()).describe('Rubric scores for the call.'),
  transcript: z.string().describe('The transcript of the call.'),
  timestamps: z.array(z.object({
    segment: z.string().describe('Description of the audio segment.'),
    startTime: z.string().describe('Start time of the segment (e.g., 00:01:23).'),
    endTime: z.string().describe('End time of the segment (e.g., 00:01:28).'),
  })).describe('Timestamps of notable audio segments.'),
  universityName: z.string().describe('The name of the university.'),
  domain: z.string().describe('The domain or department of the call (e.g., Admissions, Financial Aid).'),
  callDate: z.string().describe('The date of the call (e.g., 2024-01-01).'),
});
export type GenerateCoachingTipsInput = z.infer<typeof GenerateCoachingTipsInputSchema>;

const GenerateCoachingTipsOutputSchema = z.object({
  coachingTips: z.array(z.string()).describe('Generated coaching tips for the agent.'),
});
export type GenerateCoachingTipsOutput = z.infer<typeof GenerateCoachingTipsOutputSchema>;

export async function generateCoachingTips(input: GenerateCoachingTipsInput): Promise<GenerateCoachingTipsOutput> {
  return generateCoachingTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCoachingTipsPrompt',
  input: {schema: GenerateCoachingTipsInputSchema},
  output: {schema: GenerateCoachingTipsOutputSchema},
  prompt: `You are a highly skilled coaching expert for university agents.
  Based on the rubric scores, transcript, and timestamps of notable audio segments from a call, generate targeted coaching tips for the agent.

  University: {{{universityName}}}
  Domain: {{{domain}}}
  Call Date: {{{callDate}}}

  Rubric Scores:
  {{#each rubricScores}}
    {{@key}}: {{this}}
  {{/each}}

  Transcript: {{{transcript}}}

  Notable Audio Segments:
  {{#each timestamps}}
    - Segment: {{{segment}}}, Start Time: {{{startTime}}}, End Time: {{{endTime}}}
  {{/each}}

  Coaching Tips:
  `,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateCoachingTipsFlow = ai.defineFlow(
  {
    name: 'generateCoachingTipsFlow',
    inputSchema: GenerateCoachingTipsInputSchema,
    outputSchema: GenerateCoachingTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
