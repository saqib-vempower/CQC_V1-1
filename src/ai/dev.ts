import { config } from 'dotenv';
config();

import '@/ai/flows/transcribe-audio.ts';
import '@/ai/flows/analyze-call-transcript.ts';
import '@/ai/flows/generate-coaching-tips.ts';
import '@/ai/flows/store-call-record.ts';
