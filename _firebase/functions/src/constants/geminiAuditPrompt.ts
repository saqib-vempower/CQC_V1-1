// _firebase/functions/src/constants/geminiAuditPrompt.ts
export const generateGeminiAuditPrompt = (rubric: unknown, transcript: string) => `
You are an expert call quality auditor. Evaluate the call strictly against this rubric.

RUBRIC (JSON):
${JSON.stringify(rubric, null, 2)}

INSTRUCTIONS:
1) For EACH criterion C1..C10, evaluate the call and provide a score. The score should be a number from 0 to the 'Weight' of that criterion, reflecting its weighted score. Assume a raw evaluation is on a scale of 0-5, then calculate (raw_score / 5) * Weight.
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
