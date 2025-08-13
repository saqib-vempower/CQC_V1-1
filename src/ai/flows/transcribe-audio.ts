'use server';

/**
 * @fileOverview A flow to transcribe audio files using AssemblyAI.
 *
 * - transcribeAudio - A function that handles the audio transcription process.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { AssemblyAI } from 'assemblyai';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio file to transcribe, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcript: z.string().describe('The transcribed text of the audio file.'),
  words: z.array(z.object({
    text: z.string(),
    start: z.number(),
    end: z.number(),
    speaker: z.string().nullable(),
  })).describe('Word-level timestamps and speaker labels.'),
  sentiment: z.string().describe('Overall sentiment of the call.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async ({ audioDataUri }) => {
    const client = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY,
    });

    const transcript = await client.transcripts.transcribe({
      audio: audioDataUri,
      speaker_labels: true,
      sentiment_analysis: true,
    });

    if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }

    const words = (transcript.words || []).map(word => ({
      text: word.text,
      start: word.start,
      end: word.end,
      speaker: word.speaker,
    }));

    const overallSentiment = transcript.sentiment_analysis_results?.reduce(
      (acc, result) => {
        if (result.sentiment === 'POSITIVE') acc.positive++;
        else if (result.sentiment === 'NEGATIVE') acc.negative++;
        else acc.neutral++;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );

    let sentiment = 'NEUTRAL';
    if(overallSentiment) {
        if (overallSentiment.positive > overallSentiment.negative && overallSentiment.positive > overallSentiment.neutral) {
            sentiment = 'POSITIVE';
        } else if (overallSentiment.negative > overallSentiment.positive && overallSentiment.negative > overallSentiment.neutral) {
            sentiment = 'NEGATIVE';
        }
    }


    return {
      transcript: transcript.text || '',
      words: words,
      sentiment: sentiment,
    };
  }
);
