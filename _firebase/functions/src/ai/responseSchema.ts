// _firebase/functions/src/ai/responseSchema.ts
export const geminiAuditResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["scores", "summary", "improvementTips", "na"],
  properties: {
    scores: {
      type: "object",
      additionalProperties: false,
      required: ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10"],
      properties: {
        c1: {anyOf: [{type: "integer"}, {type: "null"}]},
        c2: {anyOf: [{type: "integer"}, {type: "null"}]},
        c3: {anyOf: [{type: "integer"}, {type: "null"}]},
        c4: {anyOf: [{type: "integer"}, {type: "null"}]},
        c5: {anyOf: [{type: "integer"}, {type: "null"}]},
        c6: {anyOf: [{type: "integer"}, {type: "null"}]},
        c7: {anyOf: [{type: "integer"}, {type: "null"}]},
        c8: {anyOf: [{type: "integer"}, {type: "null"}]},
        c9: {anyOf: [{type: "integer"}, {type: "null"}]},
        c10: {anyOf: [{type: "integer"}, {type: "null"}]},
      },
    },
    na: {
      type: "array",
      items: {type: "string", pattern: "^c(10|[1-9])$"},
    },
    summary: {type: "string", minLength: 1},
    improvementTips: {type: "string", minLength: 1},
  },
} as const;

export type ScoreKey = `c${1|2|3|4|5|6|7|8|9|10}`;
export type GeminiAudit = {
  scores: Record<ScoreKey, number|null>;
  na: ScoreKey[];
  summary: string;
  improvementTips: string;
};
