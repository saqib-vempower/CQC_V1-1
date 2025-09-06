// _firebase/functions/src/ai/scoreCall.ts
import {onMessagePublished} from "firebase-functions/v2/pubsub";
import * as logger from "firebase-functions/logger";
import {db} from "../common";
import {callGeminiStrictJSON, needSecrets} from "./geminiClient";
import {generateGeminiAuditPrompt} from "../constants/geminiAuditPrompt";
import {z} from "zod";
import {geminiAuditResponseSchema} from "./responseSchema";
import {computeObservables} from "./computeObservables";
import {PubSub} from "@google-cloud/pubsub"; // Keep this import
import * as admin from "firebase-admin";
// import {getStorage} from "firebase-admin/storage"; // Removed getStorage import

const pubSubClient = new PubSub(); // Correctly initialize PubSub client
// const storage = getStorage(); // Removed storage initialization

// Create a Zod schema from the plain object for runtime validation
const responseValidator = z.object({
  scores: z.object({
    c1: z.number().nullable(),
    c2: z.number().nullable(),
    c3: z.number().nullable(),
    c4: z.number().nullable(),
    c5: z.number().nullable(),
    c6: z.number().nullable(),
    c7: z.number().nullable(),
    c8: z.number().nullable(),
    c9: z.number().nullable(),
    c10: z.number().nullable(),
  }),
  na: z.array(z.string()),
  summary: z.string(),
  improvementTips: z.string(),
});

export const scoreCall = onMessagePublished(
  {
    topic: "score-call",
    ...needSecrets(),
  },
  async (event) => {
    const {auditId, transcriptId} = event.data.message.json;
    if (!auditId || !transcriptId) {
      logger.error("Audit ID or Transcript ID is missing from the message.", event.data.message);
      return;
    }

    logger.info(`'scoreCall' function triggered for audit ID: ${auditId}`);
    const auditRef = db.collection("audits").doc(auditId);
    const transcriptRef = db.collection("transcripts").doc(transcriptId);
    const rubricRef = db.collection("rubric").doc("v1.0");

    try {
      await auditRef.update({
        status: "Scoring",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info(`Audit ${auditId} status updated to 'Scoring'.`);

      const [auditDoc, transcriptDoc, rubricDoc] = await Promise.all([
        auditRef.get(),
        transcriptRef.get(),
        rubricRef.get(),
      ]);

      if (!auditDoc.exists) {
        logger.error(`Audit document not found for ID: ${auditId}`);
        return;
      }
      if (!transcriptDoc.exists) {
        logger.error(`Transcript document not found for ID: ${transcriptId}`);
        await auditRef.update({
          status: "Auditing Failed",
          error: "Transcript data not found for scoring.",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }
      if (!rubricDoc.exists) {
        logger.error("Rubric document 'v1.0' not found in 'rubric' collection.");
        await auditRef.update({
          status: "Auditing Failed",
          error: "Scoring rubric not found.",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      const auditData = auditDoc.data();
      const transcriptData = transcriptDoc.data();
      const rubricData = rubricDoc.data();
      if (!auditData || !transcriptData || !rubricData) {
        logger.error("Audit, transcript, or rubric data is undefined.");
        return;
      }

      const {utterances} = transcriptData;
      if (!utterances || utterances.length === 0) {
        logger.error(`No utterances found in the Firestore transcript document for ${transcriptId}.`);
        await auditRef.update({
          status: "Auditing Failed",
          error: "No utterances found in transcript document.",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      const transcriptText = transcriptData.textSummary;
      const observables = computeObservables(utterances);
      const prompt = generateGeminiAuditPrompt(rubricData, transcriptText, observables);

      const responseText = await callGeminiStrictJSON(prompt, geminiAuditResponseSchema);
      const parsedResponse = JSON.parse(responseText);
      const validatedResponse = responseValidator.parse(parsedResponse);

      await auditRef.update({
        ...validatedResponse,
        observables,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const topicName = "calculate-final-score";
      await pubSubClient.topic(topicName).publishMessage({json: {auditId}});
      logger.info(`Successfully scored audit ${auditId} and published to '${topicName}'.`);
    } catch (error) {
      logger.error(`Error scoring call for audit ${auditId}:`, error);
      let errorMessage = "An unknown error occurred during scoring.";
      let statusMessage = "Auditing Failed";

      if (error instanceof z.ZodError) {
        errorMessage = "AI response validation failed.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage.includes("Gemini HTTP 503")) {
          statusMessage = "AI Overloaded";
        }
      }
      try {
        await auditRef.update({
          status: statusMessage,
          error: errorMessage,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (dbError) {
        logger.error(`Failed to update audit ${auditId} with error status:`, dbError);
      }
    }
  },
);
