
import { config } from 'dotenv';
config();

import '@/ai/flows/transcribe-audio.ts';
import '@/ai/flows/analyze-call-transcript.ts';
import '@/ai/flows/generate-coaching-tips.ts';
import '@/ai/flows/store-call-record.ts';
import '@/ai/flows/get-all-calls.ts';
import '@/ai/flows/export-to-sheets.ts';
import '@/ai/flows/score-rubric.ts';
