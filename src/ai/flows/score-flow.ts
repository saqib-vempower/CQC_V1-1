
'use server';
/**
 * @fileOverview Scores a call transcript against a predefined rubric.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const ScoreFlowInputSchema = z.object({
  transcript: z.string().describe('The full, diarized transcript of the call.'),
});
export type ScoreFlowInput = z.infer<typeof ScoreFlowInputSchema>;

export const ScoreFlowOutputSchema = z.object({
    overall: z.number().describe('The overall weighted score, from 0 to 100.'),
    criteria: z.array(z.object({
        criterion: z.string().describe('The name of the scoring criterion.'),
        score: z.number().describe('The score given for this criterion.'),
        maxScore: z.number().describe('The maximum possible score for this criterion.'),
        reasoning: z.string().describe('A brief justification for the score, citing evidence from the transcript.'),
    })).describe('A detailed breakdown of the score for each criterion.')
});
export type ScoreFlowOutput = z.infer<typeof ScoreFlowOutputSchema>;


export async function scoreFlow(input: ScoreFlowInput): Promise<ScoreFlowOutput> {
  return scoreTranscriptFlow(input);
}

const scoringRubric = `
You are a QA analyst for a university contact center. Your task is to score a call transcript based on the following rubric.
For each criterion, provide a score and a brief reasoning supported by evidence from the transcript.
The final output must be a valid JSON object matching the provided schema.

SCORING RUBRIC (Total 100 points):

1.  **C1: Opening, Purpose & Identity** (Max: 10 points)
    - Agent clearly states their name and the university's name.
    - Agent professionally states the purpose of the call (if outbound) or actively listens to the caller's purpose (if inbound).

2.  **C2: Active Listening & Empathy** (Max: 12 points)
    - Agent uses reflective statements and paraphrasing to confirm understanding.
    - Agent acknowledges the prospect's feelings and situation with empathetic language.

3.  **C3: Clarity & Organization** (Max: 10 points)
    - Agent speaks clearly and at an appropriate pace.
    - Information is presented logically and is easy to follow.

4.  **C4: Managing Holds, Pauses & Lookups** (Max: 12 points)
    - Agent asks for permission before placing the prospect on hold.
    - Agent provides context for any silences or pauses (e.g., "I'm just looking that up for you now.").
    - Agent thanks the prospect for holding.

5.  **C5: Probing & Clarification** (Max: 8 points)
    - Agent asks relevant open-ended questions to uncover the prospect's needs.
    - Agent asks clarifying questions to ensure full understanding of the issue.

6.  **C6: Information Delivery & Handoff** (Max: 10 points)
    - Agent provides accurate and relevant information.
    - If a handoff is needed, the agent explains who they are transferring to and why.

7.  **C7: Handling Student Decisions** (Max: 12 points)
    - Agent remains neutral and professional regardless of the prospect's decision.
    - Agent accurately documents the outcome and any required follow-up.

8.  **C8: Professional Tone & Language** (Max: 8 points)
    - Agent maintains a positive, professional, and courteous tone throughout the call.
    - Avoids slang, jargon, and overly casual language.

9.  **C9: Audio Hygiene (Agent‑side)** (Max: 8 points)
    - Agent's audio is clear and free of background noise, static, or volume issues.
    - (Deduct points for issues, but assume 8/8 if transcript is clear).

10. **C10: Wrap‑up, Next Steps & Disposition** (Max: 10 points)
    - Agent summarizes the call and confirms agreed-upon next steps.
    - Agent asks if there is anything else they can help with.
    - Agent provides a warm and professional closing.
`;

const scoreTranscriptFlow = ai.defineFlow(
  {
    name: 'scoreTranscriptFlow',
    inputSchema: ScoreFlowInputSchema,
    outputSchema: ScoreFlowOutputSchema,
  },
  async ({ transcript }) => {
    
    const model = ai.getModel('googleai/gemini-1.5-flash-latest');

    const response = await model.generate({
      prompt: `${scoringRubric}\n\nHere is the transcript to score:\n\n${transcript}`,
      output: {
        format: 'json',
        schema: ScoreFlowOutputSchema,
      },
      config: {
        temperature: 0.2,
      },
    });

    const output = response.output;
    if (!output) {
      throw new Error("Failed to get a valid scoring response from the model.");
    }
    
    // Recalculate overall score to ensure accuracy, as the model might make small math errors.
    const calculatedOverall = output.criteria.reduce((acc, criterion) => acc + criterion.score, 0);
    output.overall = Math.round(calculatedOverall);

    return output;
  }
);
