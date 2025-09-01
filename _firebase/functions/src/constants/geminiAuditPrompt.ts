// _firebase/functions/src/constants/geminiAuditPrompt.ts
export const generateGeminiAuditPrompt = (rubric: unknown, transcript: string) => `
You are an expert call quality auditor. Evaluate the call strictly against this rubric.

RUBRIC (JSON):
${JSON.stringify(rubric, null, 2)}

INSTRUCTIONS:
1) Score EACH criterion C1..C10 as a whole number in [0,5].
2) All keys c1..c10 MUST be numbers (not strings).
3) Provide "summary" and "improvementTips" grounded in the transcript.
4) Output ONLY a valid JSON object, no prose.

RESPONSE SHAPE:
{
  "c1": 0, "c2": 0, "c3": 0, "c4": 0, "c5": 0,
  "c6": 0, "c7": 0, "c8": 0, "c9": 0, "c10": 0,
  "summary": "",
  "improvementTips": ""
}

TRANSCRIPT:
${transcript}
`.trim();
