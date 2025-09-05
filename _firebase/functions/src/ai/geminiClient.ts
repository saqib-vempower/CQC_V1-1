// _firebase/functions/src/ai/geminiClient.ts
import {defineSecret} from "firebase-functions/params";

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
// Reverting model name based on user's confirmation.
const MODEL = "gemini-2.5-pro"; 
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Define a type for the expected structure of the Gemini API response
type GeminiResponse = {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
};

export function needSecrets() {
  return {secrets: [GEMINI_API_KEY]};
}

export async function callGeminiStrictJSON(prompt: string, jsonSchema: unknown) {
  const apiKey = GEMINI_API_KEY.value();
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const body = {
    contents: [{role: "user", parts: [{text: prompt}]}],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: "application/json",
      response_schema: jsonSchema,
    },
  };

  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errTxt = await res.text().catch(()=>"");
    throw new Error(`Gemini HTTP ${res.status}: ${errTxt}`);
  }

  const json = (await res.json()) as GeminiResponse;
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Gemini returned no text payload");
  }
  return text;
}
