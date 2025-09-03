// _firebase/functions/src/audit-pipeline/processor.ts
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {GoogleGenAI} from "@google/genai";
import {GENAI_KEY, db} from "../common";
import {generateGeminiAuditPrompt} from "../constants/geminiAuditPrompt";

type Score = number | "NA";
interface Scores {
  c1: Score; c2: Score; c3: Score; c4: Score; c5: Score;
  c6: Score; c7: Score; c8: Score; c9: Score; c10: Score;
}

interface AuditResult {
  c1: Score; c2: Score; c3: Score; c4: Score; c5: Score;
  c6: Score; c7: Score; c8: Score; c9: Score; c10: Score;
  summary: string;
  improvementTips: string;
}

export const onAiAuditing = onDocumentUpdated(
  {
    document: "audits/{auditId}",
    secrets: [GENAI_KEY],
    region: "us-central1",
  },
  async (event) => {
    const auditId = event.params.auditId;
    const afterData = event.data?.after.data();
    const beforeData = event.data?.before.data();

    if (afterData?.status !== "Auditing" || beforeData?.status === "Auditing") {
      return;
    }
    if (!afterData.transcript) {
      await db.collection("audits").doc(auditId).update({status: "Auditing Error", error: "Missing transcript for auditing."});
      return;
    }

    try {
      const rubricDoc = await db.collection("rubric").doc("v1.0").get();
      if (!rubricDoc.exists) throw new Error("Rubric document v1.0 not found in 'rubric' collection.");
      const rubric = rubricDoc.data();
      logger.info(`Successfully fetched rubric 'v1.0' for audit ${auditId}.`);

      if (!process.env.GOOGLE_GENAI_API_KEY) {
        logger.error("GOOGLE_GENAI_API_KEY secret is not loaded.");
        await db.collection("audits").doc(auditId).update({
          status: "Auditing Error",
          error: "Google Generative AI API Key not available.",
        });
        return;
      }
      const ai = new GoogleGenAI({apiKey: process.env.GOOGLE_GENAI_API_KEY});
      logger.info(`Using GoogleGenAI model: gemini-2.5-flash for audit ${auditId}.`);

      const prompt = generateGeminiAuditPrompt(rubric, afterData.transcript);
      logger.info(`Generated Gemini prompt for audit ${auditId}.`);

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{text: prompt}],
      });

      if (!result.text) {
        throw new Error("Gemini API did not return any text content.");
      }

      const jsonText = result.text.replace(/```json|```/g, "").trim();
      const auditResult: AuditResult = JSON.parse(jsonText);
      logger.info(`Gemini audit completed for ${auditId}.`);

      const parseScore = (score: string | number | "NA"): Score => {
        if (score === "NA") return "NA";
        const num = parseFloat(score as string);
        return isNaN(num) ? 0 : num;
      };

      const scores: Scores = {
        c1: parseScore(auditResult.c1), c2: parseScore(auditResult.c2),
        c3: parseScore(auditResult.c3), c4: parseScore(auditResult.c4),
        c5: parseScore(auditResult.c5), c6: parseScore(auditResult.c6),
        c7: parseScore(auditResult.c7), c8: parseScore(auditResult.c8),
        c9: parseScore(auditResult.c9), c10: parseScore(auditResult.c10),
      };

      await db.collection("audits").doc(auditId).update({
        status: "Scored",
        ...scores,
        summary: auditResult.summary || "",
        improvementTips: auditResult.improvementTips || "",
      });
      logger.info(`Audit ${auditId} successfully scored and updated in Firestore.`);
    } catch (error) {
      logger.error(`Error during Gemini audit for ${auditId}:`, error);
      await db.collection("audits").doc(auditId).update({status: "Auditing Error", error: `Auditing Error: ${(error as Error).message}`});
    }
  },
);
