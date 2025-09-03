// _firebase/functions/src/constants/geminiAuditPrompt.ts
export const generateGeminiAuditPrompt = (rubric: unknown, transcript: string) => `
You are an expert call quality auditor. Evaluate the call strictly against this rubric.

RUBRIC (JSON):
${JSON.stringify(rubric, null, 2)}

INSTRUCTIONS:
1) For EACH criterion C1..C10, evaluate the call and provide a score.
   - If there is enough information to score a criterion, the score should be an INTEGER from 0 to the 'Weight' of that criterion, reflecting its weighted score. Assume a raw evaluation is on a scale of 0-5, then calculate (raw_score / 5) * Weight and round to the nearest whole number.
   - If there is not enough data available to audit a criterion, meaning the criterion is not applicable to the call, the value for that criterion key MUST be the string "NA".
2) All keys c1..c10 that are not "NA" MUST be numbers (not strings).
3) Provide a concise "summary".
4) Provide "improvementTips" in markdown format. For each area of improvement, create a bold heading (e.g., **Active Listening (C2):**). Under each heading, provide a bulleted list of specific, actionable tips. Each bullet point must start with an asterisk (*).
5) Output ONLY a valid JSON object, no prose.

RESPONSE SHAPE:
{
  "c1": 0, "c2": "NA", "c3": 5, "c4": 0, "c5": 10,
  "c6": 0, "c7": 0, "c8": 0, "c9": 0, "c10": 0,
  "summary": "A brief summary of the call quality.",
  "improvementTips": "**Active Listening (C2):**\\n* When the student mentions X, acknowledge it by saying Y.\\n* Ask clarifying questions about Z.\\n\\n**Call Opening (C1):**\\n* State the purpose of the call more clearly at the beginning."
}

TRANSCRIPT:
${transcript}
`.trim();
