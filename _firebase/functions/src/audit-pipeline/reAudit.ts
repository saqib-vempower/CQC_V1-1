import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {AssemblyAI} from "assemblyai";
import {getStorage} from "firebase-admin/storage";
import {db, AAI_KEY, AAI_WEBHOOK} from "../common";

const storage = getStorage();

export const reAuditCall = onCall(
  {
    secrets: [AAI_KEY, AAI_WEBHOOK],
    region: "asia-south2",
  },
  async (request) => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    const { auditId } = request.data;

    if (!auditId) {
      throw new HttpsError(
        "invalid-argument",
        "The 'auditId' parameter is required."
      );
    }

    const auditRef = db.collection("audits").doc(auditId);

    try {
      const auditDoc = await auditRef.get();

      if (!auditDoc.exists) {
        throw new HttpsError("not-found", `Audit with ID ${auditId} not found.`);
      }
      
      const auditData = auditDoc.data();
      if (!auditData) {
        throw new HttpsError("internal", `No data found for audit ID ${auditId}.`);
      }
      
      const storagePath = auditData.storagePath;
      const bucketName = admin.app().options.storageBucket;

      if (!storagePath || !bucketName) {
        throw new HttpsError(
          "failed-precondition",
          "Storage path or bucket name not found for this audit."
        );
      }
      
      // Note: Secret loading is handled by the function's configuration, so this check is for runtime safety.
      if (!process.env.ASSEMBLYAI_API_KEY || !process.env.ASSEMBLYAI_WEBHOOK_SECRET) {
          logger.error("AssemblyAI secrets are not loaded.");
          await auditRef.update({
              status: "Transcribing Error",
              error: "AssemblyAI secrets are not available.",
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          throw new HttpsError("internal", "AssemblyAI secrets are not available.");
      }
      
      logger.info(`Re-auditing initiated for audit ID: ${auditId}. Fetching audio from: ${storagePath}`);

      await auditRef.update({
        status: "Re-Transcribing",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      const file = storage.bucket(bucketName).file(storagePath);
      const expires = Date.now() + 60 * 60 * 1000; // 1 hour
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires,
      });
      logger.info(`Generated signed URL for ${storagePath}.`);

      const client = new AssemblyAI({apiKey: process.env.ASSEMBLYAI_API_KEY});
      const projectId = admin.app().options.projectId;
      const webhookUrl = `https://us-central1-${projectId}.cloudfunctions.net/onAiTranscripting?auditId=${auditId}`;

      logger.info(`Submitting re-transcript to AssemblyAI for audit ${auditId}.`);
      const transcript = await client.transcripts.create({
        audio_url: signedUrl,
        speaker_labels: true,
        webhook_url: webhookUrl,
        webhook_auth_header_name: "x-webhook-secret",
        webhook_auth_header_value: process.env.ASSEMBLYAI_WEBHOOK_SECRET,
      });

      await auditRef.update({
        transcriptId: transcript.id,
        status: "Re-Transcribing Submitted",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info(`Successfully submitted re-transcript to AssemblyAI. New Transcript ID: ${transcript.id}`);

      return { status: "success", message: `Re-audit for ${auditId} initiated.` };
    } catch (error) {
      logger.error(`[Re-Audit Failure] Failed to re-audit call ${auditId}:`, error);
      
      // If it's already an HttpsError, rethrow it directly.
      if (error instanceof HttpsError) {
        throw error;
      }
      
      // For other errors, update the document and throw a generic internal error
      const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred.";
      try {
        await auditRef.update({
          status: "Re-Audit Error",
          error: `Re-Audit Error: ${errorMessage}`,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (dbError) {
        logger.error(`Failed to update Firestore document ${auditId} with re-audit error status:`, dbError);
      }
      
      throw new HttpsError(
        "internal",
        "Failed to re-audit call."
        // We avoid passing the original error details to the client.
      );
    }
  }
);
