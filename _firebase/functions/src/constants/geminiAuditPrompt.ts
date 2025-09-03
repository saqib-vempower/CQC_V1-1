// _firebase/functions/src/constants/geminiAuditPrompt.ts
export const generateGeminiAuditPrompt = (
  rubric: unknown,
  transcript: string,
  observables: unknown
) => `
You are an expert call quality auditor. Evaluate strictly against the rubric.

RUBRIC (JSON):
${JSON.stringify(rubric, null, 2)}

OBSERVABLES (JSON):
${JSON.stringify(observables, null, 2)}

POLICY FOR SHORT / LOW-SIGNAL CALLS:
- If the call is very short (e.g., totalDurationSec < 20 OR totalWords < 30), avoid guessing.
- Prefer null (i.e., not applicable) for criteria that lack clear evidence, especially C2..C9.
- Only score criteria where evidence is explicit in transcript (e.g., C1, C10).

INSTRUCTIONS:
1) Return "scores" with c1..c10. Each value is an INTEGER from 0 to that criterion's Weight, or null if truly not scoreable.
   - Raw judgement is on a 0–5 scale; compute weighted = round((raw/5) * Weight).
   - Use OBSERVABLES to score C4 and C9. Do not return null for C4/C9 unless there is no signal at all.
2) Include an "na" array listing every key set to null.
3) All scored keys must be numbers (not strings). Do NOT output "NA" as a string anywhere.
4) Provide a concise "summary".
5) Provide "improvementTips" in markdown; each section begins with **Criterion Name (C#):** then bulleted tips starting with *.
6) Output ONLY valid JSON matching the schema shown below (no extra keys, no prose).

RESPONSE SHAPE:
{
  "scores": { "c1":0,"c2":0,"c3":0,"c4":0,"c5":0,"c6":0,"c7":0,"c8":0,"c9":0,"c10":0 },
  "na": ["c4","c9"],
  "summary": "…",
  "improvementTips": "…"
}

TRANSCRIPT:
${transcript}
`.trim();
