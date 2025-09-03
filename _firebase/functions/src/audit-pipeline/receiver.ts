// _firebase/functions/src/audit-pipeline/receiver.ts
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {db, AAI_WEBHOOK, AAI_KEY} from "../common";
import {AssemblyAI} from "assemblyai";
import * as admin from "firebase-admin";

export const onAiTranscripting = onRequest(
  {
    secrets: [AAI_WEBHOOK, AAI_KEY],
    region: "us-central1", // Set region to match Firestore
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

    const {auditId} = req.query;
    if (!auditId || typeof auditId !== "string") {
      logger.error("Bad Request: Missing or invalid audit ID in query parameters.");
      res.status(400).send("Bad Request: Missing or invalid audit ID.");
      return;
    }

    const {transcript_id, status} = req.body;
    if (!transcript_id) {
      res.status(400).send("Bad Request: Missing transcript ID in body.");
      return;
    }

    try {
      const auditRef = db.collection("audits").doc(auditId);
      if (status === "completed") {
        if (!process.env.ASSEMBLYAI_API_KEY) {
          logger.error("ASSEMBLYAI_API_KEY secret is not loaded for onAiTranscripting.");
          await auditRef.update({
            status: "Transcribing Error", // Specific error status
            error: "AssemblyAI API Key not available for transcript retrieval.",
          });
          res.status(500).send("Internal Server Error: API Key missing.");
          return;
        }
        const client = new AssemblyAI({apiKey: process.env.ASSEMBLYAI_API_KEY});
        logger.info(`Fetching full transcript for ID: ${transcript_id}`);
        const fullTranscript = await client.transcripts.get(transcript_id);
        logger.info("Full transcript fetched from AssemblyAI.", {status: fullTranscript.status, textLength: fullTranscript.text?.length});

        // Log the full transcript response for debugging
        logger.debug("Full transcript response:", JSON.stringify(fullTranscript, null, 2));

        const transcriptText = fullTranscript.text;
        const utterances = fullTranscript.utterances;

        if (typeof transcriptText === "undefined" || transcriptText === null) {
          logger.warn(`Transcript text is empty or undefined for transcript_id: ${transcript_id}. Setting status to Transcribing Error.`);
          await auditRef.update({
            status: "Transcribing Error", // Specific error status
            error: "Transcript text was empty or not provided after retrieval.",
          });
          res.status(200).send("Webhook received, but transcript text was missing after retrieval.");
          return;
        }

        const transcriptRef = db.collection("transcripts").doc(transcript_id);
        const batch = db.batch();

        batch.set(transcriptRef, {
          transcript: transcriptText,
          utterances: utterances || [],
          transcribedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        batch.update(auditRef, {
          status: "Transcribed",
        });

        await batch.commit();

        logger.info(`Audit ${auditId} status updated to 'Transcribed' and transcript ${transcript_id} saved.`);
        res.status(200).send("Webhook received successfully, transcript fetched and saved.");
      } else if (status === "error") {
        logger.error(`AssemblyAI reported an error for transcript ${transcript_id}:`, req.body.error);
        await auditRef.update({
          status: "Transcribing Error", // Specific error status
          error: `AssemblyAI transcription failed: ${req.body.error}`,
        });
        res.status(200).send("Error webhook acknowledged.");
      } else {
        logger.info(`Received AssemblyAI webhook with status: ${status}. Acknowledging.`);
        // If we want to capture intermediate statuses like 'queued', 'processing', etc.
        // We could update the Firestore status here if needed.
        res.status(200).send("Webhook acknowledged.");
      }
    } catch (error) {
      logger.error(`Error processing webhook for audit ${auditId} and transcript ${transcript_id}:`, error);
      await db.collection("audits").doc(auditId).update({
        status: "Transcribing Error", // Specific error status
        error: `Error during transcript retrieval: ${(error as Error).message}`,
      });
      res.status(500).send("Internal Server Error");
    }
  },
);
