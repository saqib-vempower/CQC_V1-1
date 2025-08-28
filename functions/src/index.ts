import * as functions from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import {AssemblyAI} from "assemblyai";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateGeminiAuditPrompt } from "./constants/geminiAuditPrompt";

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();
const storage = getStorage();

// Define the secrets that our functions need to access.
// These should be set via `firebase functions:secrets:set SECRET_NAME`
const requiredSecrets = ["ASSEMBLYAI_API_KEY", "ASSEMBLYAI_WEBHOOK_SECRET", "GOOGLE_GENAI_API_KEY"];

/**
 * =================================================================================
 * 1. ON AUDIO UPLOADED - Transcription Initiator (The "Fan-Out")
 * =================================================================================
 */
export const onAudioUploadedV1 = functions.runWith({secrets: requiredSecrets}).storage.object().onFinalize(
  async (object) => {
    const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
    const WEBHOOK_SECRET = process.env.ASSEMBLYAI_WEBHOOK_SECRET;

    if (!ASSEMBLYAI_API_KEY || !WEBHOOK_SECRET) {
      functions.logger.error("ASSEMBLYAI secrets not set in Secret Manager. Function cannot proceed.");
      return;
    }
    
    const {bucket: bucketName, name: filePath, contentType} = object;

    if (!filePath?.startsWith("audits/")) {
      functions.logger.log(`Ignoring file: ${filePath} (not in audits folder).`);
      return;
    }
    if (!contentType?.startsWith("audio/")) {
      functions.logger.log(`Ignoring file: ${filePath} (not an audio file).`);
      return;
    }

    const auditQuery = await db.collection("audits").where("storagePath", "==", filePath).limit(1).get();
    if (auditQuery.empty) {
        functions.logger.error(`FATAL: No Firestore document found for storage path: ${filePath}`);
        return;
    }
    const auditDoc = auditQuery.docs[0];
    const auditId = auditDoc.id;

    try {
      if (auditDoc.data().status !== "Uploaded") {
        functions.logger.log(`Audit ${auditId} already processed. Skipping.`);
        return;
      }

      const region = "asia-south1";
      const projectId = process.env.GCLOUD_PROJECT;
      if (!projectId) throw new Error("GCLOUD_PROJECT env variable not set.");
      
      const webhookUrl = `https://${region}-${projectId}.cloudfunctions.net/assemblyAiWebhook?auditId=${auditId}`;
    
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
        webhook_auth_header_value: WEBHOOK_SECRET, // This is now safe
      });

      await auditDoc.ref.update({
        status: "Transcribing",
        assemblyaiTranscriptId: transcript.id,
      });

      functions.logger.info(`Successfully submitted to AssemblyAI. Audit ID: ${auditId}`);

    } catch (error: any) {
      const errorMessage = error.message || "An unknown error occurred.";
      functions.logger.error(`[FATAL] Error processing audit ${auditId}:`, errorMessage);
      await auditDoc.ref.update({ status: "Transcription Failed", error: errorMessage });
    }
  });

/**
 * =================================================================================
 * 2. ASSEMBLY AI WEBHOOK - Transcription Receiver (The "Fan-In")
 * =================================================================================
 */
export const assemblyAiWebhook = functions.runWith({secrets: requiredSecrets}).region("asia-south1").https.onRequest(async (req, res) => {
  const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
  const WEBHOOK_SECRET = process.env.ASSEMBLYAI_WEBHOOK_SECRET;

  if (!ASSEMBLYAI_API_KEY || !WEBHOOK_SECRET) {
      functions.logger.error("Webhook secrets not configured in Secret Manager.");
      res.status(500).send("Internal configuration error.");
      return;
  }

  if (req.headers["x-webhook-secret"] !== WEBHOOK_SECRET) {
    functions.logger.warn("Webhook called with invalid secret.");
    res.status(401).send("Unauthorized");
    return;
  }

  const { auditId } = req.query;
  if (typeof auditId !== 'string') {
    functions.logger.error("Webhook called without a valid auditId query parameter.");
    res.status(400).send("Bad Request: Missing auditId");
    return;
  }

  const { transcript_id, status } = req.body;
  if (!transcript_id) {
    functions.logger.error("Webhook called without a transcript_id in the body.");
    res.status(400).send("Bad Request: Missing transcript_id");
    return;
  }

  const auditDocRef = db.collection("audits").doc(auditId);

  try {
    const docSnapshot = await auditDocRef.get();
    if (docSnapshot.exists && docSnapshot.data()?.status === "Auditing") {
      functions.logger.log(`Audit ${auditId} has already been transcribed and is being audited. Acknowledging webhook retry.`);
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
      status: "Auditing", // Change status to Auditing
      transcript: completedTranscript.text || "",
      utterances: utterances,
      transcribedAt: admin.firestore.FieldValue.serverTimestamp(),
      error: admin.firestore.FieldValue.delete(),
    });

    functions.logger.info(`Successfully fetched and saved transcript for audit ID: ${auditId}. Moving to Auditing status.`);
    
    res.status(200).send("OK");

  } catch (error: any) {
    const errorMessage = error.message || "An unknown error occurred.";
    functions.logger.error(`Error processing webhook for audit ID ${auditId}:`, errorMessage);
    await auditDocRef.update({status: "Transcription Failed", error: errorMessage});
    res.status(500).send("Internal Server Error");
  }
});

/**
 * =================================================================================
 * 3. ON TRANSCRIPT AUDITED - NLP Processor
 * =================================================================================
 */
export const onTranscriptAuditedV1 = functions.runWith({secrets: requiredSecrets}).region("asia-south1").firestore
  .document("audits/{auditId}")
  .onUpdate(async (change, context) => {
    // Access the API key via process.env for 1st Gen functions when using `runWith({secrets: [...]})`
    const GOOGLE_API_KEY = process.env.GOOGLE_GENAI_API_KEY; 

    if (!GOOGLE_API_KEY) {
      functions.logger.error("GOOGLE_GENAI_API_KEY not set in Secret Manager. Function cannot proceed.");
      return;
    }

    const auditId = context.params.auditId;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Ensure the status has changed to Auditing and transcript is present
    if (beforeData?.status !== "Auditing" && afterData?.status === "Auditing" && afterData?.transcript) {
      functions.logger.info(`Starting NLP audit for audit ID: ${auditId}`);

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
        functions.logger.info(`Gemini Raw Response: ${text}`);

        const nlpResults = JSON.parse(text);

        await auditDocRef.update({ 
          ...nlpResults, // Spread the NLP results into the document
          status: "Completed",
          auditedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: admin.firestore.FieldValue.delete(), // Clear any previous errors
        });

        functions.logger.info(`Successfully completed NLP audit for audit ID: ${auditId}. Status: Completed.`);

      } catch (error: any) {
        const errorMessage = error.message || "An unknown error occurred during NLP audit.";
        functions.logger.error(`[FATAL] Error during NLP audit for audit ID ${auditId}:`, errorMessage);
        await auditDocRef.update({ status: "Auditing Failed", error: errorMessage });
      }
    } else {
      functions.logger.log(`Audit ${auditId} status is not transitioning to Auditing or transcript is missing. Skipping NLP audit.`);
    }
  });