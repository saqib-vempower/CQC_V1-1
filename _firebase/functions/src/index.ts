import {initializeApp} from "firebase-admin/app";
import {getFirestore, DocumentData} from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import {AssemblyAI} from "assemblyai";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateGeminiAuditPrompt } from "./constants/geminiAuditPrompt";
import {onObjectFinalized} from "firebase-functions/v2/storage";
import {onRequest} from "firebase-functions/v2/https";
import {onDocumentUpdated, onDocumentWritten} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();
const storage = getStorage();

// Type Definitions for robust type-checking
type Scores = Record<`c${1|2|3|4|5|6|7|8|9|10}`, number>;

// Expected structure from the Gemini API response
interface GeminiAuditResponse extends Scores {
  summary: string;
  improvementTips: string;
}

// Structure for the rubric document in Firestore
interface Rubric extends DocumentData {
    criteria: Record<string, { weight: number }>;
    weights?: Record<string, number>;
}

const requiredSecrets = ["ASSEMBLYAI_API_KEY", "ASSEMBLYAI_WEBHOOK_SECRET", "GOOGLE_GENAI_API_KEY", "ASSEMBLYAI_WEBHOOK_URL"];

/**
 * =================================================================================
 * 1. ON AUDIO UPLOADED - Transcription Initiator
 * =================================================================================
 */
export const onAudioUploaded = onObjectFinalized(
  {
    region: "asia-south2",
    bucket: process.env.STORAGE_BUCKET,
    secrets: requiredSecrets,
    timeoutSeconds: 300,
    memory: "1GiB",
  },
  async (event) => {
    const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
    const WEBHOOK_SECRET = process.env.ASSEMBLYAI_WEBHOOK_SECRET;
    const WEBHOOK_URL = process.env.ASSEMBLYAI_WEBHOOK_URL;

    if (!ASSEMBLYAI_API_KEY || !WEBHOOK_SECRET || !WEBHOOK_URL) {
      logger.error("AssemblyAI secrets not set. Function cannot proceed.");
      return;
    }
    
    const {bucket: bucketName, name: filePath, contentType} = event.data;

    if (!filePath?.startsWith("audits/") || !contentType?.startsWith("audio/")) {
      logger.log(`Ignoring non-audio file in non-audits folder: ${filePath}`);
      return;
    }

    const auditQuery = await db.collection("audits").where("storagePath", "==", filePath).limit(1).get();
    if (auditQuery.empty) {
        logger.error(`No Firestore doc found for storage path: ${filePath}`);
        return;
    }
    const auditDoc = auditQuery.docs[0];
    const auditId = auditDoc.id;

    try {
      if (auditDoc.data().status !== "Uploaded") {
        logger.log(`Audit ${auditId} status is not 'Uploaded'. Skipping.`);
        return;
      }

      const webhookUrl = `${WEBHOOK_URL}?auditId=${auditId}`;
    
      const assemblyai = new AssemblyAI({apiKey: ASSEMBLYAI_API_KEY});
      
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filePath);
      const [publicUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000,
      });
      
      const transcript = await assemblyai.transcripts.create({
        audio_url: publicUrl,
        speaker_labels: true,
        webhook_url: webhookUrl,
        webhook_auth_header_name: "x-webhook-secret",
        webhook_auth_header_value: WEBHOOK_SECRET,
      });

      await auditDoc.ref.update({
        status: "Transcribing",
        assemblyaiTranscriptId: transcript.id,
      });

      logger.info(`Transcription submitted for Audit ID: ${auditId}`);

    } catch (error: any) {
      const errorMessage = error.message || "Unknown error occurred.";
      logger.error(`Error processing audit ${auditId}:`, errorMessage);
      await auditDoc.ref.update({ status: "Transcription Failed", error: errorMessage });
    }
  });

/**
 * =================================================================================
 * 2. ASSEMBLY AI WEBHOOK - Transcription Receiver
 * =================================================================================
 */
export const assemblyAiWebhook = onRequest(
  {
    region: "asia-south1",
    secrets: requiredSecrets,
    timeoutSeconds: 120,
    memory: "512MiB",
  },
  async (req, res) => {
    const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
    const WEBHOOK_SECRET = process.env.ASSEMBLYAI_WEBHOOK_SECRET;

    if (!ASSEMBLYAI_API_KEY || !WEBHOOK_SECRET) {
        logger.error("Webhook secrets not configured.");
        res.status(500).send("Internal configuration error.");
        return;
    }

    if (req.headers["x-webhook-secret"] !== WEBHOOK_SECRET) {
      logger.warn("Invalid webhook secret.");
      res.status(401).send("Unauthorized");
      return;
    }

    const { auditId } = req.query;
    if (typeof auditId !== 'string') {
      logger.error("Missing auditId query parameter.");
      res.status(400).send("Bad Request: Missing auditId");
      return;
    }

    const { transcript_id, status } = req.body;
    if (!transcript_id) {
      logger.error("Missing transcript_id in webhook body.");
      res.status(400).send("Bad Request: Missing transcript_id");
      return;
    }

    const auditDocRef = db.collection("audits").doc(auditId);

    try {
      const docSnapshot = await auditDocRef.get();
      if (docSnapshot.exists && docSnapshot.data()?.status === "Auditing") {
        logger.log(`Audit ${auditId} is already 'Auditing'. Acknowledging webhook.`);
        res.status(200).send("OK");
        return;
      }

      if (status === "error") {
        const errorMessage = req.body.error || "Unknown AssemblyAI error.";
        await auditDocRef.update({status: "Transcription Failed", error: errorMessage});
        res.status(200).send("OK");
        return;
      }

      if (status !== "completed") {
        logger.log(`Webhook for transcript ${transcript_id} is not 'completed' (status: ${status}). Ignoring.`);
        res.status(200).send("OK");
        return;
      }

      const assemblyai = new AssemblyAI({apiKey: ASSEMBLYAI_API_KEY});
      const completedTranscript = await assemblyai.transcripts.get(transcript_id);
      
      if (!completedTranscript) {
          throw new Error("Fetched transcript from AssemblyAI was invalid.");
      }

      const utterances = (completedTranscript.utterances || []).map((u) => ({
          speaker: u.speaker || 'N/A',
          text: u.text || '',
      }));
      
      await auditDocRef.update({
        status: "Auditing",
        transcript: completedTranscript.text || "",
        utterances: utterances,
        transcribedAt: admin.firestore.FieldValue.serverTimestamp(),
        error: admin.firestore.FieldValue.delete(),
      });

      logger.info(`Transcript for audit ${auditId} saved. Status -> Auditing.`);
      res.status(200).send("OK");

    } catch (error: any) {
      const errorMessage = error.message || "Unknown error occurred.";
      logger.error(`Webhook error for audit ${auditId}:`, errorMessage);
      await auditDocRef.update({status: "Transcription Failed", error: errorMessage});
      res.status(500).send("Internal Server Error");
    }
});


/**
 * =================================================================================
 * 3. ON TRANSCRIPT AUDITED - NLP Processor
 * =================================================================================
 */
export const onTranscriptAudited = onDocumentUpdated(
  {
    document: "audits/{auditId}",
    region: "asia-south1",
    secrets: requiredSecrets,
    timeoutSeconds: 540,
    memory: "1GiB",
  },
  async (event) => {
    const GOOGLE_API_KEY = process.env.GOOGLE_GENAI_API_KEY; 

    if (!GOOGLE_API_KEY) {
      logger.error("GOOGLE_GENAI_API_KEY not set. Cannot proceed.");
      return;
    }

    const auditId = event.params.auditId;
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (beforeData?.status === "Auditing" || afterData?.status !== "Auditing" || !afterData?.transcript) {
        logger.log(`Skipping NLP audit for ${auditId}: Not a transition to 'Auditing' state.`);
        return;
    }
    
    logger.info(`Starting NLP audit for audit ID: ${auditId}`);

    const transcript = afterData.transcript;
    const auditDocRef = db.collection("audits").doc(auditId); 
    
    try {
      const rubricDoc = await db.collection("rubric").doc("v1.0").get();
      if (!rubricDoc.exists) {
        throw new Error("Rubric v1.0 not found in Firestore.");
      }
      const rubric = rubricDoc.data() as Rubric;

      const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-pro-latest",
        generationConfig: {
          temperature: 0,
          topP: 0,
          topK: 1,
          candidateCount: 1,
          maxOutputTokens: 512,
          responseMimeType: "application/json"
        } 
      });

      const prompt = generateGeminiAuditPrompt(rubric, transcript);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const raw = JSON.parse(text) as GeminiAuditResponse;

      const weights: Record<string, number> =
        rubric.weights ??
        Object.fromEntries(
          Object.entries(rubric.criteria).map(([k, v]) => [k, v?.weight ?? 0])
        );

      const rawScores: Scores = {
        c1: Math.max(0, Math.min(5, raw.c1 ?? 0)),
        c2: Math.max(0, Math.min(5, raw.c2 ?? 0)),
        c3: Math.max(0, Math.min(5, raw.c3 ?? 0)),
        c4: Math.max(0, Math.min(5, raw.c4 ?? 0)),
        c5: Math.max(0, Math.min(5, raw.c5 ?? 0)),
        c6: Math.max(0, Math.min(5, raw.c6 ?? 0)),
        c7: Math.max(0, Math.min(5, raw.c7 ?? 0)),
        c8: Math.max(0, Math.min(5, raw.c8 ?? 0)),
        c9: Math.max(0, Math.min(5, raw.c9 ?? 0)),
        c10: Math.max(0, Math.min(5, raw.c10 ?? 0)),
      };

      const perCriterionMarks: Record<string, number> = {};
      let finalCqScore = 0;

      (Object.keys(rawScores) as Array<keyof Scores>).forEach((key) => {
        const weight = weights[key] || 0;
        const mark = (rawScores[key] / 5) * weight;
        perCriterionMarks[`${key}Marks`] = Number(mark.toFixed(2));
        finalCqScore += mark;
      });

      await auditDocRef.update({
        ...rawScores,
        ...perCriterionMarks,
        finalCqScore: Math.round(finalCqScore),
        summary: raw.summary ?? "",
        improvementTips: raw.improvementTips ?? "",
        rubricVersion: "v1.0",
        status: "Completed",
        auditedAt: admin.firestore.FieldValue.serverTimestamp(),
        error: admin.firestore.FieldValue.delete(),
      });

      logger.info(`Successfully completed NLP audit for ID: ${auditId}.`);

    } catch (error: any) {
      const errorMessage = error.message || "Unknown NLP audit error.";
      logger.error(`NLP audit failed for ${auditId}:`, errorMessage);
      await auditDocRef.update({ status: "Auditing Failed", error: errorMessage });
    }
  });

/**
 * =================================================================================
 * 4. ON USER DOC CHANGE - Sync Role to Custom Claims
 * =================================================================================
 */
export const onUserRoleChange = onDocumentWritten(
    {
        document: "users/{userId}",
        region: "asia-south1",
        secrets: requiredSecrets,
    },
    async (event) => {
        const userId = event.params.userId;
        const afterData = event.data?.after.data();
        const beforeData = event.data?.before.data();

        const newRole = afterData?.role;
        const oldRole = beforeData?.role;

        if (newRole === oldRole) {
            logger.log(`User ${userId} role unchanged.`);
            return;
        }
        
        if (!afterData) {
            logger.log(`User ${userId} document deleted. Removing claims.`);
            await admin.auth().setCustomUserClaims(userId, null);
            return;
        }

        try {
            await admin.auth().setCustomUserClaims(userId, { role: newRole });
            await event.data!.after.ref.update({ claimsUpdatedAt: admin.firestore.FieldValue.serverTimestamp() });
            logger.info(`Set custom claim for user ${userId} to '${newRole}'.`);
        } catch (error: any) {
            logger.error(`Error setting custom claim for user ${userId}:`, error.message);
        }
    }
);
