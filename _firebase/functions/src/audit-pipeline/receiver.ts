// _firebase/functions/src/audit-pipeline/receiver.ts
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {db, AAI_WEBHOOK, AAI_KEY} from "../common";
import {AssemblyAI} from "assemblyai";
import * as admin from "firebase-admin";
// Removed getStorage import as we're no longer using Cloud Storage for this

// const storage = getStorage(); // Removed initialization

export const onAiTranscripting = onRequest(
  {
    secrets: [AAI_WEBHOOK, AAI_KEY],
    region: "us-central1",
  },
  async (req, res) => {
    logger.info("AssemblyAI webhook body received:", req.body);

    if (req.header("x-webhook-secret") !== process.env.ASSEMBLYAI_WEBHOOK_SECRET) {
      logger.error("Unauthorized webhook call");
      res.status(401).send("Unauthorized");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const {transcript_id: transcriptId, status} = req.body;
    const auditId = req.query.auditId as string;

    if (!auditId) {
      logger.error("Audit ID is missing from the webhook URL query parameters.");
      res.status(400).send("Bad Request: Audit ID is missing.");
      return;
    }

    const auditRef = db.collection("audits").doc(auditId);

    try {
      if (status === "completed") {
        logger.info(`Fetching full transcript for ID: ${transcriptId}`);
        const client = new AssemblyAI({apiKey: process.env.ASSEMBLYAI_API_KEY});
        const transcript = await client.transcripts.get(transcriptId);

        if (!transcript) {
          logger.error(`Transcript with ID ${transcriptId} not found or returned empty.`);
          await auditRef.update({
            status: "Transcribing Error",
            error: `Transcript with ID ${transcriptId} could not be fetched or was empty.`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          res.status(404).send("Transcript not found.");
          return;
        }

        logger.debug("Full transcript response:", transcript);

        const transcriptText = transcript.text;
        const fullUtterances = transcript.utterances; // Keep full utterances

        if (!transcriptText || !fullUtterances || fullUtterances.length === 0) {
          logger.error("Transcript text or utterances are unexpectedly missing or empty from the AssemblyAI response.");
          await auditRef.update({
            status: "Transcribing Error",
            error: "Transcript text or utterances missing or empty from AssemblyAI response.",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          res.status(400).send("Bad Request: Incomplete transcript data.");
          return;
        }

        // --- Removed Cloud Storage saving logic ---
        // The full utterances will now be saved directly to Firestore

        const transcriptRef = db.collection("transcripts").doc(transcriptId);
        const batch = db.batch();

        batch.set(transcriptRef, {
          auditId: auditId,
          textSummary: transcriptText, 
          utterances: fullUtterances, // Save full utterances directly to Firestore
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        batch.update(auditRef, {
          status: "Transcribed",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        try {
          await batch.commit();
          logger.info(`Audit ${auditId} status updated to 'Transcribed' and transcript ${transcriptId} saved directly to Firestore.`);
          res.status(200).send("Webhook received successfully, transcript fetched and saved.");
        } catch (commitError) {
          logger.error(`[Firestore Commit Failure] Error saving transcript ${transcriptId} for audit ${auditId}:`, commitError);
          // Since you're seeing full transcripts in Firestore already, this catch might not trigger if that's the actual case.
          // However, it's good to keep for robust error handling.
          await auditRef.update({
            status: "Transcribing Error",
            error: `Firestore commit failed: ${(commitError as Error).message}`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          res.status(500).send("Internal Server Error: Firestore commit failed.");
          return;
        }

      } else if (status === "error") {
        logger.error(`AssemblyAI reported an error for transcript ${transcriptId}:`, req.body.error);
        await auditRef.update({
          status: "Transcribing Error",
          error: `AssemblyAI transcription failed: ${req.body.error}`,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).send("Error webhook acknowledged.");
      } else {
        logger.info(`Received AssemblyAI webhook with status: ${status}. Acknowledging.`);
        res.status(200).send("Webhook acknowledged.");
      }
    } catch (error) {
      logger.error(`[Critical Failure] Error processing webhook for audit ${auditId} and transcript ${transcriptId}:`, error);
      let errorMessage = "An unknown error occurred during webhook processing.";
      if (error instanceof Error) {
        errorMessage = `Webhook processing failed: ${error.message}`;
      }
      try {
        await auditRef.update({
          status: "Transcribing Error",
          error: errorMessage,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (dbError) {
        logger.error(`Failed to update Firestore document ${auditId} with error status after a critical failure:`, dbError);
      }
      res.status(500).send("Internal Server Error");
    }
  },
);
