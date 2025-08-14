
import {genkit, service} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import type {Firestore} from 'firebase-admin/firestore';

export const ai = genkit({
  plugins: [
    googleAI(),
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
