'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {service} from 'genkit';

const ValidateUserInputSchema = z.object({
  email: z.string().email(),
});

const ValidateUserOutputSchema = z.object({
  isValid: z.boolean(),
  userId: z.string().optional(),
});

export async function validateUser(
  input: z.infer<typeof ValidateUserInputSchema>
): Promise<z.infer<typeof ValidateUserOutputSchema>> {
  return validateUserFlow(input);
}

const validateUserFlow = ai.defineFlow(
  {
    name: 'validateUserFlow',
    inputSchema: ValidateUserInputSchema,
    outputSchema: ValidateUserOutputSchema,
  },
  async ({email}) => {
    // Get an authenticated Firestore client from the service defined in genkit.ts
    const firestore = service('firestore').db();

    const allowedUsersCollection = firestore.collection('AllowedUsers');
    const userDoc = await allowedUsersCollection.doc(email).get();

    if (userDoc.exists) {
      // The user ID is the email itself for custom token generation
      return {isValid: true, userId: email};
    } else {
      return {isValid: false};
    }
  }
);
