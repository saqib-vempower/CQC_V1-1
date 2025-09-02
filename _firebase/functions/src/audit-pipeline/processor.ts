// _firebase/functions/src/audit-pipeline/processor.ts
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {GoogleGenAI} from "@google/genai"; // Changed to GoogleGenAI
import {GENAI_KEY, db, Scores} from "../common";
import {generateGeminiAuditPrompt} from "../constants/geminiAuditPrompt";

export const onAiAuditing = onDocumentUpdated(
  {
    document: "audits/{auditId}",
    secrets: [GENAI_KEY], // RE-ADDED GENAI_KEY to secrets
    region: "us-central1", // Set region to match Firestore
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
      logger.info(`Successfully fetched rubric 'v1.0' from 'rubric' collection for audit ${auditId}.`);

      // --- REVERTED to using GoogleGenerativeAI SDK directly ---
      if (!process.env.GOOGLE_GENAI_API_KEY) {
        logger.error("GOOGLE_GENAI_API_KEY secret is not loaded for onAiAuditing.");
        await db.collection("audits").doc(auditId).update({
          status: "Auditing Error",
          error: "Google Generative AI API Key not available.",
        });
        return;
      }
      const ai = new GoogleGenAI({apiKey: process.env.GOOGLE_GENAI_API_KEY as string}); // Changed client initialization
      logger.info(`Using GoogleGenAI model: gemini-2.5-flash for audit ${auditId}.`); // Updated log message
      // -----------------------------------------------------------------------

      const prompt = generateGeminiAuditPrompt(rubric, afterData.transcript);
      logger.info(`Generated Gemini prompt for audit ${auditId}.`);

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash", // Changed to gemini-2.5-flash
        contents: [{text: prompt}],
      });

      if (!result.text) {
        throw new Error("Gemini API did not return any text content.");
      }

      const jsonText = result.text.replace(/```json|```/g, "").trim(); // Corrected to directly access text property
      const auditResult = JSON.parse(jsonText);
      logger.info(`Gemini audit completed for ${auditId}.`);

      await db.collection("audits").doc(auditId).update({status: "Audited"});
      logger.info(`Audit ${auditId} status updated to 'Audited'.`);

      const scores: Scores = {
        c1: auditResult.c1 || 0, c2: auditResult.c2 || 0, c3: auditResult.c3 || 0,
        c4: auditResult.c4 || 0, c5: auditResult.c5 || 0, c6: auditResult.c6 || 0,
        c7: auditResult.c7 || 0, c8: auditResult.c8 || 0, c9: auditResult.c9 || 0,
        c10: auditResult.c10 || 0,
      };

      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
      logger.info(`Calculated total score for audit ${auditId}: ${totalScore}`);

      await db.collection("audits").doc(auditId).update({
        status: "Completed",
        ...scores,
        summary: auditResult.summary || "",
        improvementTips: auditResult.improvementTips || "",
        finalCqScore: totalScore,
      });
      logger.info(`Audit ${auditId} successfully completed and updated in Firestore.`);
    } catch (error) {
      logger.error(`Error during Gemini audit for ${auditId}:`, error);
      await db.collection("audits").doc(auditId).update({status: "Auditing Error", error: `Auditing Error: ${(error as Error).message}`});
    }
  },
);
