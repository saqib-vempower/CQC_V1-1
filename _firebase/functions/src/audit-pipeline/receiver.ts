// _firebase/functions/src/audit-pipeline/receiver.ts
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {db, AAI_WEBHOOK} from "../common";

export const onAiTranscripting = onRequest(
  {
    secrets: [AAI_WEBHOOK],
    region: "us-central1", // Set region to match Firestore
  },
  async (req, res) => {
    if (req.header("x-webhook-secret") !== process.env.ASSEMBLYAI_WEBHOOK_SECRET) {
      logger.error("Unauthorized webhook call");
      res.status(401).send("Unauthorized");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const {transcript_id, status} = req.body;
    if (!transcript_id) {
      res.status(400).send("Bad Request: Missing transcript ID.");
      return;
    }

    try {
      const auditRef = db.collection("audits").doc(transcript_id);
      if (status === "completed") {
        await auditRef.update({status: "Auditing", transcript: req.body.text});
        res.status(200).send("Webhook received successfully.");
      } else if (status === "error") {
        await auditRef.update({status: "Error", error: req.body.error});
        res.status(200).send("Error webhook acknowledged.");
      } else {
        res.status(200).send("Webhook acknowledged.");
      }
    } catch (error) {
      logger.error(`Error processing webhook for ${transcript_id}:`, error);
      res.status(500).send("Internal Server Error");
    }
  },
);
