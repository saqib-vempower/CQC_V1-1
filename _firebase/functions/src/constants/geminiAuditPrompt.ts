export const generateGeminiAuditPrompt = (rubric: any, transcript: string): string => {
  return `You are an expert call quality auditor. Your task is to meticulously evaluate the provided call transcript against a detailed rubric.

**Rubric:**
${JSON.stringify(rubric, null, 2)}

**Instructions:**
1. For each criterion (C1 to C10), carefully read the description and the 5-anchor, 3-anchor, and 1-anchor examples in the rubric.
2. Assign a score from 0 to 5 for each criterion based on how well the agent's performance in the transcript matches the anchors. Use whole numbers (0, 1, 2, 3, 4, 5).
   *   **5**: Perfectly meets or exceeds the 5-anchor.
   *   **3**: Generally meets the 3-anchor, with some areas for improvement or partial success in meeting the 5-anchor.
   *   **1**: Matches the 1-anchor or shows significant deficiencies.
   *   **0**: No evidence of the criterion, or actively detrimental performance.
   *   **2, 4**: Intermediate performance levels.
3. Provide a concise \`summary\` of the overall call quality, highlighting key strengths and weaknesses.
4. Offer specific, actionable \`improvementTips\` for the agent, directly referencing the criteria where performance could be enhanced.

**Call Transcript to Audit:**
"""${transcript}"""

**Output Format:**
Your response MUST be a JSON object, and ONLY a a JSON object. Do NOT wrap the JSON in markdown code blocks (e.g., no \`\`\`json or \`\`\` delimiters). Do NOT include any other text, explanations, or markdown outside this JSON object. The JSON object should precisely match the following structure:
{
  "c1": <number, score 0-5>,
  "c2": <number, score 0-5>,
  "c3": <number, score 0-5>,
  "c4": <number, score 0-5>,
  "c5": <number, score 0-5>,
  "c6": <number, score 0-5>,
  "c7": <number, score 0-5>,
  "c8": <number, score 0-5>,
  "c9": <number, score 0-5>,
  "c10": <number, score 0-5>,
  "summary": "<string, concise summary of call quality>",
  "improvementTips": "<string, specific, actionable tips for agent improvement>"
}
`;
};
