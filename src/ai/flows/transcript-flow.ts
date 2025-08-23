
'use server';
/**
 * @fileOverview Transcribes an audio file using Gemini 1.5 Pro.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const TranscriptFlowInputSchema = z.object({
  audioGcsUri: z.string().describe('The Google Cloud Storage URI of the audio file to transcribe.'),
});
export type TranscriptFlowInput = z.infer<typeof TranscriptFlowInputSchema>;

export const TranscriptFlowOutputSchema = z.array(
    z.object({
        speaker: z.enum(['A', 'B']).describe('The identified speaker (A or B).'),
        start: z.number().describe('The start time of the utterance in seconds.'),
        end: z.number().describe('The end time of the utterance in seconds.'),
        text: z.string().describe('The transcribed text of the utterance.'),
    })
);
export type TranscriptFlowOutput = z.infer<typeof TranscriptFlowOutputSchema>;

export async function transcriptFlow(input: TranscriptFlowInput): Promise<TranscriptFlowOutput> {
  return transcriptAudioFlow(input);
}

const transcriptAudioFlow = ai.defineFlow(
  {
    name: 'transcriptAudioFlow',
    inputSchema: TranscriptFlowInputSchema,
    outputSchema: TranscriptFlowOutputSchema,
  },
  async ({ audioGcsUri }) => {

    const model = ai.getModel('googleai/gemini-1.5-pro-latest');
    
    const response = await model.generate({
      prompt: [
        {
          text: `
            You are a highly accurate audio transcription and diarization service.
            Your task is to transcribe the provided audio file and identify the two speakers, labeling them as "A" and "B".
            Provide the output as a valid JSON array where each object contains the speaker, start time, end time, and the transcribed text.
            Do not include any other text or explanations in your response, only the JSON array.
            
            Example format:
            [
              {"speaker": "A", "start": 0.5, "end": 2.1, "text": "Hello, thank you for calling."},
              {"speaker": "B", "start": 2.5, "end": 4.0, "text": "Hi, I'm calling about my application."}
            ]
          `,
        },
        { media: { url: audioGcsUri } },
      ],
      output: {
        format: 'json',
        schema: TranscriptFlowOutputSchema
      },
      config: {
        temperature: 0.1, // Lower temperature for more deterministic transcription
      }
    });

    const output = response.output;
    if (!output) {
      throw new Error("Failed to get a valid transcription response from the model.");
    }

    return output;
  }
);
