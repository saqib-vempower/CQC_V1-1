// _firebase/functions/src/ai/responseSchema.ts
// This schema defines the expected structure of the JSON response from the Gemini API.
// It is formatted in a simplified OpenAPI/JSON Schema style that the Gemini API's
// `response_schema` field expects when `response_mime_type` is set to `application/json`.
// Keywords like `additionalProperties`, `anyOf` are not supported directly here and are removed.

export const geminiAuditResponseSchema = {
  type: "object",
  required: ["scores", "summary", "improvementTips", "na"],
  properties: {
    scores: {
      type: "object",
      required: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10"],
      properties: {
        c1: {type: "number", nullable: true}, // Using nullable: true for number or null
        c2: {type: "number", nullable: true},
        c3: {type: "number", nullable: true},
        c4: {type: "number", nullable: true},
        c5: {type: "number", nullable: true},
        c6: {type: "number", nullable: true},
        c7: {type: "number", nullable: true},
        c8: {type: "number", nullable: true},
        c9: {type: "number", nullable: true},
        c10: {type: "number", nullable: true},
      },
    },
    na: {
      type: "array",
      items: {type: "string"}, // Simplified item definition
    },
    summary: {type: "string"},
    improvementTips: {type: "string"},
  },
} as const;

export type ScoreKey = `c${1|2|3|4|5|6|7|8|9|10}`;
export type GeminiAudit = {
  scores: Record<ScoreKey, number|null>;
  na: ScoreKey[];
  summary: string;
  improvementTips: string;
};
