// _firebase/functions/src/audit-pipeline/initiator.ts
import {onObjectFinalized} from "firebase-functions/v2/storage";
import * as logger from "firebase-functions/logger";
import {AssemblyAI} from "assemblyai";
import * as admin from "firebase-admin";
import {getStorage} from "firebase-admin/storage";
import {db, AAI_KEY, AAI_WEBHOOK} from "../common";

const storage = getStorage();

export const onCallUpload = onObjectFinalized(
  {
    secrets: [AAI_KEY, AAI_WEBHOOK],
    region: "asia-south2",
  },
  async (event) => {
    logger.info("onCallUpload triggered for a new file.");

    if (!process.env.ASSEMBLYAI_API_KEY) {
      logger.error("ASSEMBLYAI_API_KEY secret is not loaded.");
      const filePath = event.data.name;
      const auditId = filePath.split("/")[1]?.split("-")[0];
      if (auditId) {
        await db.collection("audits").doc(auditId).update({
          status: "Transcribing Error",
          error: "AssemblyAI API Key not available for transcription submission.",
        });
      }
      throw new Error("ASSEMBLYAI_API_KEY secret is not available.");
    }

    const {bucket: bucketName, name: filePath, contentType} = event.data;
    logger.info(`Processing file: ${filePath} in bucket: ${bucketName}`);

    if (!contentType?.startsWith("audio/")) {
      logger.info(`File ${filePath} is not an audio file, skipping.`);
      return;
    }

    const filePathParts = filePath.split("/");
    let auditId = "";
    if (filePathParts.length > 1) {
      const fileNameWithAuditId = filePathParts[1];
      const match = fileNameWithAuditId.match(/^([^-]+)-.*$/);
      if (match && match[1]) {
        auditId = match[1];
      }
    }

    if (!auditId) {
      logger.error(`auditId could not be extracted from filePath: ${filePath}. Aborting process.`);
      return;
    }
    logger.info(`Found auditId: ${auditId} parsed from filePath.`);

    const auditDocRef = db.collection("audits").doc(auditId);

    try {
      await auditDocRef.update({
        storagePath: filePath,
        status: "Uploaded",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info(`Successfully updated audit document ${auditId} to 'Uploaded'.`);

      const file = storage.bucket(bucketName).file(filePath);
      const expires = Date.now() + 60 * 60 * 1000; // 1 hour
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires,
      });
      logger.info(`Generated signed URL for ${filePath}.`);

      const client = new AssemblyAI({apiKey: process.env.ASSEMBLYAI_API_KEY});
      const projectId = admin.app().options.projectId;
      const webhookUrl = `https://us-central1-${projectId}.cloudfunctions.net/onAiTranscripting?auditId=${auditId}`;
      
      await auditDocRef.update({
        status: "Transcribing",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info(`Submitting transcript to AssemblyAI for audit ${auditId}.`);

      const transcript = await client.transcripts.create({
        audio_url: signedUrl,
        speaker_labels: true,
        webhook_url: webhookUrl,
        webhook_auth_header_name: "x-webhook-secret",
        webhook_auth_header_value: process.env.ASSEMBLYAI_WEBHOOK_SECRET,
      });

      await auditDocRef.update({
        transcriptId: transcript.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info(`Successfully submitted transcript to AssemblyAI. Transcript ID: ${transcript.id}`);
    } catch (error) {
      logger.error(`[Critical Failure] Failed to submit transcript for audit ${auditId} on file ${filePath}:`, error);
      let errorMessage = "An unknown error occurred during transcription submission.";
      if (error instanceof Error) {
        errorMessage = `Transcribing Error: ${error.message}`;
      }
      try {
        await auditDocRef.update({
          status: "Transcribing Error",
          error: errorMessage,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (dbError) {
        logger.error(`Failed to update Firestore document ${auditId} with error status:`, dbError);
      }
    }
  },
);
