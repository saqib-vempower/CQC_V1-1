'use server';

/**
 * @fileOverview An AI agent for automatically scoring a call based on its transcript.
 *
 * - scoreRubric - A function that scores a transcript against a predefined rubric.
 * - ScoreRubricInput - The input type for the scoreRubric function.
 * - ScoreRubricOutput - The return type for the scoreRubric function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScoreRubricInputSchema = z.object({
  transcript: z.string().describe('The transcript of the call to be scored.'),
});
export type ScoreRubricInput = z.infer<typeof ScoreRubricInputSchema>;

const ScoreRubricOutputSchema = z.object({
  rubricScores: z.object({
      Opening: z.number().min(1).max(5).describe("Score for the agent's opening, from 1 to 5."),
      'Active Listening': z.number().min(1).max(5).describe("Score for the agent's active listening skills, from 1 to 5."),
      'Problem Solving': z.number().min(1).max(5).describe("Score for the agent's problem-solving abilities, from 1 to 5."),
      Professionalism: z.number().min(1).max(5).describe("Score for the agent's professionalism, from 1 to 5."),
      Closing: z.number().min(1).max(5).describe("Score for the agent's closing, from 1 to 5."),
  }).describe('The set of scores for each rubric category.'),
});
export type ScoreRubricOutput = z.infer<typeof ScoreRubricOutputSchema>;

export async function scoreRubric(input: ScoreRubricInput): Promise<ScoreRubricOutput> {
  return scoreRubricFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scoreRubricPrompt',
  input: {schema: ScoreRubricInputSchema},
  output: {schema: ScoreRubricOutputSchema},
  prompt: `You are an expert call quality analyst. Your task is to score a call transcript based on a predefined rubric.
  The rubric categories are: Opening, Active Listening, Problem Solving, Professionalism, and Closing.
  For each category, provide a score from 1 to 5, where 1 is poor and 5 is excellent.

  Analyze the following transcript and provide a score for each category.
  Base your scores solely on the content of the transcript.

  Transcript:
  {{{transcript}}}

  Provide your scores in the required JSON format.
  `,
});

const scoreRubricFlow = ai.defineFlow(
  {
    name: 'scoreRubricFlow',
    inputSchema: ScoreRubricInputSchema,
    outputSchema: ScoreRubricOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
