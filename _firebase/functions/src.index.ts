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
 * 1. ON AUDIO UPLOADED - Transcription Initiator
 * =================================================================================
 */
export const onAudioUploadedV1 = functions.runWith({secrets: requiredSecrets}).storage.object().onFinalize(
  async (object) => {
    const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
    const WEBHOOK_SECRET = process.env.ASSEMBLYAI_WEBHOOK_SECRET;

    if (!ASSEMBLYAI_API_KEY || !WEBHOOK_SECRET) {
      functions.logger.error("SECRETS NOT SET: One or more required secrets are not available in the environment.");
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

    functions.logger.log(`Processing audio file: ${filePath}`);
    
    // Get a reference to the audit document to use throughout the function
    const auditQuery = await db.collection("audits").where("storagePath", "==", filePath).limit(1).get();
    if (auditQuery.empty) {
        functions.logger.error(`FATAL: No Firestore document found for storage path: ${filePath}`);
        return;
    }
    const auditDoc = auditQuery.docs[0];

    try {
      if (auditDoc.data().status !== "Uploaded") {
        functions.logger.log(`Audit ${auditDoc.id} already processed. Skipping.`);
        return;
      }

      const region = "asia-south1";
      const projectId = process.env.GCLOUD_PROJECT;
      if (!projectId) {
          throw new Error("GCLOUD_PROJECT environment variable not set. Cannot build webhook URL.");
      }
      const webhookUrl = `https://${region}-${projectId}.cloudfunctions.net/assemblyAiWebhook`;
    
      const assemblyai = new AssemblyAI({apiKey: ASSEMBLYAI_API_KEY});
      
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filePath);
      const [publicUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });
      functions.logger.log("Successfully generated signed URL.");
      
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

      functions.logger.info(`Successfully submitted to AssemblyAI. Audit ID: ${auditDoc.id}`);

    } catch (error: any) {
      // --- ENHANCED ERROR LOGGING AND REPORTING ---
      const errorMessage = error.message || "An unknown error occurred.";
      functions.logger.error(`[FATAL] Error processing audit ${auditDoc.id}:`, errorMessage);
      
      // Also log the full error object for more details if available
      if (error) {
        functions.logger.error("Full error object:", error);
      }
      
      // Save the specific error message to the Firestore document for visibility in the UI
      await auditDoc.ref.update({
          status: "Transcription Failed", 
          error: errorMessage,
      });
    }
  });

/**
 * =================================================================================
 * 2. ASSEMBLY AI WEBHOOK - Transcription Receiver
 * =================================================================================
 */
export const assemblyAiWebhook = functions.runWith({secrets: ["ASSEMBLYAI_WEBHOOK_SECRET"]}).region("asia-south1").https.onRequest(async (req, res) => {
  const WEBHOOK_SECRET = process.env.ASSEMBLYAI_WEBHOOK_SECRET;
  
  if (req.headers["x-webhook-secret"] !== WEBHOOK_SECRET) {
    functions.logger.warn("Webhook called with invalid secret.");
    res.status(401).send("Unauthorized");
    return;
  }

  const {transcript_id, status} = req.body;
  if (status === "error") {
    const errorMessage = req.body.error || "Unknown error from AssemblyAI.";
    functions.logger.error(`Transcription failed for ID: ${transcript_id}. Reason: ${errorMessage}`);
    const auditQuery = await db.collection("audits").where("assemblyaiTranscriptId", "==", transcript_id).limit(1).get();
    if (!auditQuery.empty) {
      await auditQuery.docs[0].ref.update({status: "Transcription Failed", error: errorMessage});
    }
    res.status(200).send("Error acknowledged.");
    return;
  }

  if (status !== "completed") {
     functions.logger.info(`Received non-completed status '${status}' for transcript ${transcript_id}. Ignoring.`);
     res.status(200).send("Status acknowledged.");
     return;
  }
  
  const auditQuery = await db.collection("audits").where("assemblyaiTranscriptId", "==", transcript_id).limit(1).get();
  if (auditQuery.empty) {
    functions.logger.error(`No Firestore document found for AssemblyAI transcript ID: ${transcript_id}`);
    res.status(404).send("Audit not found.");
    return;
  }

  const auditDoc = auditQuery.docs[0];

  try {
    const utterances = req.body.utterances.map((u: any) => ({
        speaker: u.speaker,
        text: u.text,
    }));

    await auditDoc.ref.update({
      status: "Transcribed",
      transcript: req.body.text,
      utterances: utterances,
      transcribedAt: admin.firestore.FieldValue.serverTimestamp(),
      error: admin.firestore.FieldValue.delete(), // Clear any previous error
    });

    functions.logger.info(`Successfully processed transcript for audit ID: ${auditDoc.id}`);
    res.status(200).send("Transcript processed successfully.");

  } catch (error: any) {
    const errorMessage = error.message || "An unknown error occurred.";
    functions.logger.error(`Error updating Firestore for audit ID: ${auditDoc.id}`, errorMessage);
    await auditDoc.ref.update({status: "Transcription Failed", error: errorMessage});
    res.status(500).send("Internal server error.");
  }
});
