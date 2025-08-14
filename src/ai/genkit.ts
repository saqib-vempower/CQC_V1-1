import {genkit, service} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';

export const ai = genkit({
  plugins: [
    googleAI(),
    // Configure the Genkit Firebase plugin.
    // This will automatically configure the Admin SDK for use in server
    // environments, including connecting to emulators if configured.
    firebase(),
  ],
  services: [
    // Make the Firestore service available to flows.
    service('firestore', {
      functions: (client) => ({
        db: () => client,
      }),
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
