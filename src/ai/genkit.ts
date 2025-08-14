import {genkit, service} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';
import type {Firestore} from 'firebase-admin/firestore';

export const ai = genkit({
  plugins: [
    googleAI(),
    firebase(), // Genkit will auto-configure based on GOOGLE_CREDENTIALS
  ],
  services: [
    // Make the Firestore service available to flows that import `ai`.
    service('firestore', {
      functions: (client: {firestore: () => Firestore}) => ({
        db: () => client.firestore(),
      }),
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
