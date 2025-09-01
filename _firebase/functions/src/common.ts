// _firebase/functions/src/common.ts
import {getFirestore} from "firebase-admin/firestore";

// Define secrets and environment variables
export const AAI_KEY = "ASSEMBLYAI_API_KEY";
export const AAI_WEBHOOK = "ASSEMBLYAI_WEBHOOK_SECRET";
export const GENAI_KEY = "GOOGLE_GENAI_API_KEY";

export const db = getFirestore();

export interface Scores {
  c1: number; c2: number; c3: number; c4: number; c5: number;
  c6: number; c7: number; c8: number; c9: number; c10: number;
}
