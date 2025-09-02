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
      // Update Firestore with specific error status before throwing
      const filePath = event.data.name; // Get filePath for error reporting
      const auditId = filePath.split("/")[1]?.split("-")[0]; // Attempt to extract auditId
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

    // Extract auditId from filePath: audits/{auditId}-{rest_of_filename}.mp3
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
      // Attempt to update Firestore for this error case as well
      try {
        // Since we don't have a reliable auditId, we can't update a specific document.
        // A more robust solution might involve logging to a separate error collection or a dead-letter queue.
        // For now, we'll just log and abort.
      } catch (dbError) {
        logger.error("Failed to log auditId extraction error to Firestore:", dbError);
      }
      return;
    }
    logger.info(`Found auditId: ${auditId} parsed from filePath.`);

    try {
      const auditDocRef = db.collection("audits").doc(auditId);
      const auditDoc = await auditDocRef.get();

      if (!auditDoc.exists) {
        logger.error(`Firestore document for auditId ${auditId} not found. Aborting.`);
        return;
      }

      const auditData = auditDoc.data();
      logger.info(`Fetched auditData from Firestore for ${auditId}:`, auditData);

      const university = auditData?.university || "Unknown";
      const domain = auditData?.domain || "Unknown";
      const callType = auditData?.callType || "Unknown";
      const callDate = auditData?.callDate || null;
      const originalFilename = auditData?.originalFilename || "Unknown";
      const uploadedBy = auditData?.uploadedBy || "Unknown";
      const agentName = auditData?.agentName || "Unknown";
      const applicantId = auditData?.applicantId || "Unknown";

      logger.info(`Processing audit for: ID=${auditId}, University=${university}, Domain=${domain}, CallType=${callType}, Agent=${agentName}, Applicant=${applicantId}, OriginalFile=${originalFilename}, UploadedBy=${uploadedBy}, CallDate=${callDate}`);

      await auditDocRef.update({
        storagePath: filePath,
        status: "Uploaded",
      });
      logger.info(`Successfully updated audit document ${auditId} with metadata fetched from Firestore and confirmed 'Uploaded' status.`);

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
      logger.info(`Webhook URL is: ${webhookUrl}`);

      logger.info("Submitting transcript to AssemblyAI...");
      const transcript = await client.transcripts.create({
        audio_url: signedUrl,
        speaker_labels: true,
        webhook_url: webhookUrl,
        webhook_auth_header_name: "x-webhook-secret",
        webhook_auth_header_value: process.env.ASSEMBLYAI_WEBHOOK_SECRET,
      });
      logger.info(`Successfully submitted transcript to AssemblyAI. Transcript ID: ${transcript.id}`);

      logger.info(`Updating audit document ${auditId} to 'Transcribing'.`);
      await auditDocRef.update({
        status: "Transcribing",
        transcriptId: transcript.id,
      });
      logger.info(`Successfully updated audit document ${auditId} to 'Transcribing'.`);
    } catch (error) {
      logger.error(`[Critical Failure] Failed to submit transcript for audit ${auditId} on file ${filePath}:`, error);

      let errorMessage = "An unknown error occurred while submitting to AssemblyAI.";
      if (error instanceof Error) {
        errorMessage = `Transcribing Error: ${error.message}`; // Specific error message
        logger.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }

      try {
        await db.collection("audits").doc(auditId).update({
          status: "Transcribing Error", // Specific error status
          error: errorMessage,
        });
        logger.info(`Updated audit document ${auditId} to 'Transcribing Error' with the specific error.`);
      } catch (dbError) {
        logger.error(`Failed to update Firestore document ${auditId} with error status:`, dbError);
      }
    }
  },
);
