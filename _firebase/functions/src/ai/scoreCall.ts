// _firebase/functions/src/ai/scoreCall.ts
import {getFirestore} from "firebase-admin/firestore";
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {setGlobalOptions} from "firebase-functions/v2";
import Ajv from "ajv";

import {computeObservables} from "./computeObservables";
import {generateGeminiAuditPrompt} from "../constants/geminiAuditPrompt";
import {geminiAuditResponseSchema, type GeminiAudit, type ScoreKey} from "./responseSchema";
import {callGeminiStrictJSON, needSecrets} from "./geminiClient";

setGlobalOptions({region: "us-central1", memory: "1GiB", timeoutSeconds: 120});

const ajv = new Ajv({allErrors: true});
const validate = ajv.compile(geminiAuditResponseSchema);

export const scoreCall = onDocumentUpdated({
  document: "audits/{auditId}",
  ...needSecrets(),
}, async (event) => {
  const db = getFirestore();
  const auditId = event.params.auditId;
  const after = event.data?.after.data() as any;

  if (after.status !== "Scoring") {
    return;
  }

  const transcriptId = after.transcriptId;
  if (!transcriptId) throw new Error("Missing transcriptId");

  // 1) Load transcript payload
  const tSnap = await db.collection("transcripts").doc(transcriptId).get();
  if (!tSnap.exists) throw new Error("Transcript not found");
  const tData = tSnap.data() as {
    transcript: string;
    utterances?: Array<{
      speaker?: string; start?: number; end?: number; text?: string;
      words?: Array<{ text: string; confidence?: number }>;
    }>;
    agentName?: string;
    applicantId?: string;
    callDate?: string;
    callType?: string;
    domain?: string;
    university?: string;
    originalFilename?: string;
    storagePath?: string;
  };

  // 2) Load rubric v1.0
  const rSnap = await db.collection("rubrics").doc("v1.0").get();
  if (!rSnap.exists) throw new Error("Rubric v1.0 not found");
  const rubric = rSnap.data() as any;

  // 3) Derive observables (adds call stats + C4/C9 proxies)
  const observables = computeObservables(tData.utterances ?? []);

  // 4) Prompt
  const prompt = generateGeminiAuditPrompt(rubric, tData.transcript, observables);

  // 5) Call Gemini with strict schema (retry once on schema error)
  let raw = "";
  let parsed: GeminiAudit | null = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    raw = await callGeminiStrictJSON(prompt, geminiAuditResponseSchema);
    try {
      const json = JSON.parse(raw);
      if (!validate(json)) throw new Error("Schema validation failed");
      parsed = json as GeminiAudit;
      break;
    } catch (e) {
      if (attempt === 2) {
        await db.collection("audits").doc(auditId).set({
          status: "Failed",
          error: {message: String(e), raw},
          model: "gemini-1.5-pro",
          temperature: 0.1,
          rubricVersion: "v1.0",
          updatedAt: new Date(),
        }, {merge: true});
        throw e;
      }
    }
  }

  // 6) Ensure na includes all nulls (belt & suspenders)
  const na: ScoreKey[] = (Object.entries(parsed!.scores) as [ScoreKey, number|null][])
    .filter(([, v]) => v === null)
    .map(([k]) => k);
  parsed!.na = Array.from(new Set([...(parsed!.na ?? []), ...na])) as ScoreKey[];

  // 7) Flatten c1..c10 for backward-compatible UI
  const flat: Record<string, number|null> = {};
  (Object.keys(parsed!.scores) as ScoreKey[]).forEach((k) => {
    flat[k] = parsed!.scores[k];
  });

  // 8) Persist audit
  await db.collection("audits").doc(auditId).set({
    ...flat, // c1..c10
    scores: parsed!.scores,
    na: parsed!.na,
    summary: parsed!.summary,
    improvementTips: parsed!.improvementTips,
    rubricVersion: "v1.0",
    model: "gemini-1.5-pro",
    temperature: 0.1,
    status: "Scored",
    observables,
    // useful metadata passthrough
    agentName: tData.agentName ?? null,
    applicantId: tData.applicantId ?? null,
    callDate: tData.callDate ?? null,
    callType: tData.callType ?? null,
    domain: tData.domain ?? null,
    university: tData.university ?? null,
    originalFilename: tData.originalFilename ?? null,
    storagePath: tData.storagePath ?? null,
    updatedAt: new Date(),
  }, {merge: true});
});
