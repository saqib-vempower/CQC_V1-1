import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
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

// Define the secrets that our functions need to access.
const requiredSecrets = ["ASSEMBLYAI_API_KEY", "ASSEMBLYAI_WEBHOOK_SECRET", "GOOGLE_GENAI_API_KEY"];

/**
 * =================================================================================
 * 1. ON AUDIO UPLOADED - Transcription Initiator (The "Fan-Out")
 * =================================================================================
 */
export const onAudioUploaded = onObjectFinalized(
  {
    region: "asia-south2", // Pin this function to the same region as the bucket
    secrets: requiredSecrets,
    timeoutSeconds: 300,
    memory: "1GiB",
  },
  async (event) => {
    const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
    const WEBHOOK_SECRET = process.env.ASSEMBLYAI_WEBHOOK_SECRET;

    if (!ASSEMBLYAI_API_KEY || !WEBHOOK_SECRET) {
      logger.error("ASSEMBLYAI secrets not set in Secret Manager. Function cannot proceed.");
      return;
    }
    
    const {bucket: bucketName, name: filePath, contentType} = event.data;

    if (!filePath?.startsWith("audits/")) {
      logger.log(`Ignoring file: ${filePath} (not in audits folder).`);
      return;
    }
    if (!contentType?.startsWith("audio/")) {
      logger.log(`Ignoring file: ${filePath} (not an audio file).`);
      return;
    }

    const auditQuery = await db.collection("audits").where("storagePath", "==", filePath).limit(1).get();
    if (auditQuery.empty) {
        logger.error(`FATAL: No Firestore document found for storage path: ${filePath}`);
        return;
    }
    const auditDoc = auditQuery.docs[0];
    const auditId = auditDoc.id;

    try {
      if (auditDoc.data().status !== "Uploaded") {
        logger.log(`Audit ${auditId} already processed. Skipping.`);
        return;
      }

      const webhookRegion = "asia-south1"; // The webhook function is in asia-south1
      const projectId = process.env.GCLOUD_PROJECT;
      if (!projectId) throw new Error("GCLOUD_PROJECT env variable not set.");
      
      const webhookUrl = `https://${webhookRegion}-${projectId}.cloudfunctions.net/assemblyAiWebhook?auditId=${auditId}`;
    
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

      logger.info(`Successfully submitted to AssemblyAI. Audit ID: ${auditId}`);

    } catch (error: any) {
      const errorMessage = error.message || "An unknown error occurred.";
      logger.error(`[FATAL] Error processing audit ${auditId}:`, errorMessage);
      await auditDoc.ref.update({ status: "Transcription Failed", error: errorMessage });
    }
  });

/**
 * =================================================================================
 * 2. ASSEMBLY AI WEBHOOK - Transcription Receiver (The "Fan-In")
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
      logger.error("Webhook secrets not configured in Secret Manager.");
      res.status(500).send("Internal configuration error.");
      return;
  }

  if (req.headers["x-webhook-secret"] !== WEBHOOK_SECRET) {
    logger.warn("Webhook called with invalid secret.");
    res.status(401).send("Unauthorized");
    return;
  }

  const { auditId } = req.query;
  if (typeof auditId !== 'string') {
    logger.error("Webhook called without a valid auditId query parameter.");
    res.status(400).send("Bad Request: Missing auditId");
    return;
  }

  const { transcript_id, status } = req.body;
  if (!transcript_id) {
    logger.error("Webhook called without a transcript_id in the body.");
    res.status(400).send("Bad Request: Missing transcript_id");
    return;
  }

  const auditDocRef = db.collection("audits").doc(auditId);

  try {
    const docSnapshot = await auditDocRef.get();
    if (docSnapshot.exists && docSnapshot.data()?.status === "Auditing") {
      logger.log(`Audit ${auditId} has already been transcribed and is being audited. Acknowledging webhook retry.`);
      res.status(200).send("OK");
      return;
    }

    if (status === "error") {
      const errorMessage = req.body.error || "Unknown error from AssemblyAI.";
      await auditDocRef.update({status: "Transcription Failed", error: errorMessage});
      res.status(200).send("OK");
      return;
    }

    if (status !== "completed") {
      res.status(200).send("OK");
      return;
    }

    const assemblyai = new AssemblyAI({apiKey: ASSEMBLYAI_API_KEY});
    const completedTranscript = await assemblyai.transcripts.get(transcript_id);
    
    if (!completedTranscript) {
        throw new Error("Fetched transcript from AssemblyAI was empty or invalid.");
    }

    const utterances = (Array.isArray(completedTranscript.utterances) ? completedTranscript.utterances : []).map((u: any) => ({
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

    logger.info(`Successfully fetched and saved transcript for audit ID: ${auditId}. Moving to Auditing status.`);
    
    res.status(200).send("OK");

  } catch (error: any) {
    const errorMessage = error.message || "An unknown error occurred.";
    logger.error(`Error processing webhook for audit ID ${auditId}:`, errorMessage);
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
      logger.error("GOOGLE_GENAI_API_KEY not set in Secret Manager. Function cannot proceed.");
      return;
    }

    const auditId = event.params.auditId;
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (beforeData?.status !== "Auditing" && afterData?.status === "Auditing" && afterData?.transcript) {
      logger.info(`Starting NLP audit for audit ID: ${auditId}`);

      const transcript = afterData.transcript;
      const auditDocRef = db.collection("audits").doc(auditId); 
      
      try {
        // Fetch the rubric from Firestore
        const rubricDoc = await db.collection("rubric").doc("v1.0").get();
        if (!rubricDoc.exists) {
          throw new Error("Rubric v1.0 not found in Firestore.");
        }
        const rubric = rubricDoc.data();

        if (!rubric) {
            throw new Error("Rubric data is empty.");
        }

        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest"});

        const prompt = generateGeminiAuditPrompt(rubric, transcript);

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        logger.info(`Gemini Raw Response: ${text}`);

        const nlpResults = JSON.parse(text);

        await auditDocRef.update({ 
          ...nlpResults,
          status: "Completed",
          auditedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: admin.firestore.FieldValue.delete(),
        });

        logger.info(`Successfully completed NLP audit for audit ID: ${auditId}. Status: Completed.`);

      } catch (error: any) {
        const errorMessage = error.message || "An unknown error occurred during NLP audit.";
        logger.error(`[FATAL] Error during NLP audit for audit ID ${auditId}:`, errorMessage);
        await auditDocRef.update({ status: "Auditing Failed", error: errorMessage });
      }
    } else {
      logger.log(`Audit ${auditId} status is not transitioning to Auditing or transcript is missing. Skipping NLP audit.`);
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
        region: "asia-south1", // Corrected region
        secrets: requiredSecrets,
    },
    async (event) => {
    const userId = event.params.userId;
    const afterData = event.data?.after.data();
    const beforeData = event.data?.before.data();

    const role = afterData?.role;
    const oldRole = beforeData?.role;

    // If the role hasn't changed, do nothing.
    if (role === oldRole) {
        logger.log(`User ${userId} role unchanged. No action taken.`);
        return;
    }
    
    // Only act if the document still exists
    if (!event.data?.after?.exists) {
        logger.log(`User ${userId} document deleted. Removing claims.`);
        await admin.auth().setCustomUserClaims(userId, null);
        return;
    }

    try {
        await admin.auth().setCustomUserClaims(userId, { role: role });
        // Add the timestamp to the user's document to notify the client
        await event.data.after.ref.update({ claimsUpdatedAt: admin.firestore.FieldValue.serverTimestamp() });
        logger.info(`Successfully set custom claim for user ${userId}. New role: ${role}`);
    } catch (error: any) {
        logger.error(`Error setting custom claim for user ${userId}:`, error.message);
    }
});
