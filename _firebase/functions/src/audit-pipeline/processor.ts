// _firebase/functions/src/audit-pipeline/processor.ts
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {GoogleGenAI} from "@google/genai";
import {GENAI_KEY, db, Scores} from "../common";
import {generateGeminiAuditPrompt} from "../constants/geminiAuditPrompt";

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
      const auditResult = JSON.parse(jsonText);
      logger.info(`Gemini audit completed for ${auditId}.`);

      const scores: Scores = {
        c1: Math.ceil(auditResult.c1 || 0),
        c2: Math.ceil(auditResult.c2 || 0),
        c3: Math.ceil(auditResult.c3 || 0),
        c4: Math.ceil(auditResult.c4 || 0),
        c5: Math.ceil(auditResult.c5 || 0),
        c6: Math.ceil(auditResult.c6 || 0),
        c7: Math.ceil(auditResult.c7 || 0),
        c8: Math.ceil(auditResult.c8 || 0),
        c9: Math.ceil(auditResult.c9 || 0),
        c10: Math.ceil(auditResult.c10 || 0),
      };

      await db.collection("audits").doc(auditId).update({
        status: "Scored", // New status
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
