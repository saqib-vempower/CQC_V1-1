import * as functions from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {AssemblyAI} from "assemblyai";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

// --- CONFIGURATION ---
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const WEBHOOK_SECRET = process.env.ASSEMBLYAI_WEBHOOK_SECRET; // For verifying webhook authenticity

/**
 * =================================================================================
 * 1. ON AUDIO UPLOADED - Transcription Initiator
 * =================================================================================
 * This v1 Storage-triggered function kicks off the transcription process with AssemblyAI.
 */
export const onAudioUploadedV1 = functions.storage.object().onFinalize(
  async (object) => {
    if (!ASSEMBLYAI_API_KEY) {
      functions.logger.error("AssemblyAI API key is not set. Function cannot proceed.");
      return;
    }
    
    // Get the URL of our webhook function
    const webhookUrl = `https://${functions.config().location.id}-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/assemblyAiWebhook`;

    const assemblyai = new AssemblyAI({apiKey: ASSEMBLYAI_API_KEY});
    const {bucket, name: filePath, contentType} = object;

    // Standard file validation
    if (!filePath?.startsWith("audits/")) {
      functions.logger.log(`Ignoring file: ${filePath} (not in audits folder).`);
      return;
    }
    if (!contentType?.startsWith("audio/")) {
      functions.logger.log(`Ignoring file: ${filePath} (not an audio file).`);
      return;
    }

    functions.logger.log(`Processing audio file: ${filePath}`);

    try {
      const auditQuery = await db.collection("audits").where("storagePath", "==", filePath).limit(1).get();
      if (auditQuery.empty) {
        functions.logger.error(`No Firestore document found for storage path: ${filePath}`);
        return;
      }

      const auditDoc = auditQuery.docs[0];
      const auditId = auditDoc.id;

      if (auditDoc.data().status !== "Uploaded") {
        functions.logger.log(`Audit ${auditId} already processed. Skipping.`);
        return;
      }

      const fileUrl = `gs://${bucket}/${filePath}`;
      
      functions.logger.log(`Submitting audio from ${fileUrl} to AssemblyAI.`);
      
      // Submit the transcript and provide our webhook URL for the callback
      const transcript = await assemblyai.transcripts.create({
        audio_url: fileUrl,
        speaker_labels: true,
        webhook_url: webhookUrl,
        webhook_auth_header_name: "x-webhook-secret",
        webhook_auth_header_value: WEBHOOK_SECRET,
      });

      await auditDoc.ref.update({
        status: "Transcribing",
        assemblyaiTranscriptId: transcript.id,
      });

      functions.logger.info(`Successfully submitted ${filePath}. Audit ID: ${auditId}, AssemblyAI ID: ${transcript.id}`);

    } catch (error) {
      functions.logger.error("Error processing audio:", error);
      // Update the doc to reflect the failure
      const auditQuery = await db.collection("audits").where("storagePath", "==", filePath).limit(1).get();
      if (!auditQuery.empty) {
        await auditQuery.docs[0].ref.update({status: "Transcription Failed", error: (error as Error).message});
      }
    }
  });

/**
 * =================================================================================
 * 2. ASSEMBLY AI WEBHOOK - Transcription Receiver
 * =================================================================================
 * This HTTPS-triggered function receives the finished transcript from AssemblyAI.
 */
export const assemblyAiWebhook = functions.https.onRequest(async (req, res) => {
  // 1. Verify the webhook secret to ensure the request is from AssemblyAI
  if (req.headers["x-webhook-secret"] !== WEBHOOK_SECRET) {
    functions.logger.warn("Webhook called with invalid secret.");
    res.status(401).send("Unauthorized");
    return;
  }

  // 2. Check the transcript status
  const {transcript_id, status} = req.body;
  if (status === "error") {
    functions.logger.error(`Transcription failed for ID: ${transcript_id}. Reason: ${req.body.error}`);
    // Update Firestore to reflect the error
    const auditQuery = await db.collection("audits").where("assemblyaiTranscriptId", "==", transcript_id).limit(1).get();
    if (!auditQuery.empty) {
      await auditQuery.docs[0].ref.update({status: "Transcription Failed", error: req.body.error});
    }
    res.status(200).send("Error acknowledged.");
    return;
  }

  if (status !== "completed") {
     functions.logger.info(`Received non-completed status '${status}' for transcript ${transcript_id}. Ignoring.`);
     res.status(200).send("Status acknowledged.");
     return;
  }
  
  // 3. Find the corresponding document in Firestore
  const auditQuery = await db.collection("audits").where("assemblyaiTranscriptId", "==", transcript_id).limit(1).get();
  if (auditQuery.empty) {
    functions.logger.error(`No Firestore document found for AssemblyAI transcript ID: ${transcript_id}`);
    res.status(404).send("Audit not found.");
    return;
  }

  const auditDoc = auditQuery.docs[0];

  // 4. Update the Firestore document with the transcript data
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
    });

    functions.logger.info(`Successfully processed transcript for audit ID: ${auditDoc.id}`);
    res.status(200).send("Transcript processed successfully.");

  } catch (error) {
    functions.logger.error(`Error updating Firestore for audit ID: ${auditDoc.id}`, error);
    res.status(500).send("Internal server error.");
  }
});
