// _firebase/functions/src/audit-pipeline/processor.ts
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {GoogleGenerativeAI} from "@google/generative-ai";
import {GENAI_KEY, db, Scores} from "../common";
import {generateGeminiAuditPrompt} from "../constants/geminiAuditPrompt";

export const onAiAuditing = onDocumentUpdated(
  {
    document: "audits/{auditId}",
    secrets: [GENAI_KEY],
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
      await db.collection("audits").doc(auditId).update({status: "Error", error: "Missing transcript."});
      return;
    }

    try {
      const rubricDoc = await db.collection("rubrics").doc("default").get();
      if (!rubricDoc.exists) throw new Error("Default rubric not found.");
      const rubric = rubricDoc.data();

      const genai = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY as string);
      const model = genai.getGenerativeModel({model: "gemini-pro"});
      const prompt = generateGeminiAuditPrompt(rubric, afterData.transcript);
      const result = await model.generateContent(prompt);
      const response = result.response;
      const jsonText = response.text().replace(/```json|```/g, "").trim();
      const auditResult = JSON.parse(jsonText);

      const scores: Scores = {
        c1: auditResult.c1 || 0, c2: auditResult.c2 || 0, c3: auditResult.c3 || 0,
        c4: auditResult.c4 || 0, c5: auditResult.c5 || 0, c6: auditResult.c6 || 0,
        c7: auditResult.c7 || 0, c8: auditResult.c8 || 0, c9: auditResult.c9 || 0,
        c10: auditResult.c10 || 0,
      };

      await db.collection("audits").doc(auditId).update({
        status: "Completed",
        scores: scores,
        summary: auditResult.summary || "",
        improvementTips: auditResult.improvementTips || "",
      });
    } catch (error) {
      logger.error(`Error during Gemini audit for ${auditId}:`, error);
      await db.collection("audits").doc(auditId).update({status: "Error", error: "Gemini audit failed."});
    }
  },
);
