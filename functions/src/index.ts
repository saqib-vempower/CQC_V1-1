import * as functions from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import {AssemblyAI} from "assemblyai";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();
const storage = getStorage();

// Define the secrets that our functions need to access
const requiredSecrets = ["ASSEMBLYAI_API_KEY", "ASSEMBLYAI_WEBHOOK_SECRET"];

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
      functions.logger.error("SECRETS NOT SET. Function cannot proceed.");
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
export const assemblyAiWebhook = functions.runWith({secrets: ["ASSEMBLYAI_API_KEY", "ASSEMBLYAI_WEBHOOK_SECRET"]}).region("asia-south1").https.onRequest(async (req, res) => {
  const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
  const WEBHOOK_SECRET = process.env.ASSEMBLYAI_WEBHOOK_SECRET;

  if (!ASSEMBLYAI_API_KEY || !WEBHOOK_SECRET) {
      functions.logger.error("Webhook secrets not configured.");
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
    if (docSnapshot.exists && docSnapshot.data()?.status === "Transcribed") {
      functions.logger.log(`Audit ${auditId} has already been transcribed. Acknowledging webhook retry.`);
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
      status: "Transcribed",
      transcript: completedTranscript.text || "",
      utterances: utterances,
      transcribedAt: admin.firestore.FieldValue.serverTimestamp(),
      error: admin.firestore.FieldValue.delete(),
    });

    functions.logger.info(`Successfully fetched and saved transcript for audit ID: ${auditId}`);
    
    res.status(200).send("OK");

  } catch (error: any) {
    const errorMessage = error.message || "An unknown error occurred.";
    functions.logger.error(`Error processing webhook for audit ID ${auditId}:`, errorMessage);
    await auditDocRef.update({status: "Transcription Failed", error: errorMessage});
    res.status(500).send("Internal Server Error");
  }
});
