// _firebase/functions/src/audit-pipeline/processor.ts
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {db} from "../common";
import {PubSub} from "@google-cloud/pubsub";
import * as admin from "firebase-admin";

const pubSubClient = new PubSub();

export const onAiAuditing = onDocumentWritten(
  "transcripts/{transcriptId}",
  async (event) => {
    if (!event.data) {
      logger.info("No data associated with the event. Exiting.");
      return;
    }

    const transcriptData = event.data.after.data();
    if (!transcriptData) {
      logger.info("Event data is undefined. Exiting.");
      return;
    }

    const {auditId} = transcriptData;
    if (!auditId) {
      logger.error(`Audit ID is missing in transcript document: ${event.params.transcriptId}`);
      return;
    }

    logger.info(`'onAiAuditing' triggered for audit ID: ${auditId}`);
    const auditRef = db.collection("audits").doc(auditId);

    try {
      await auditRef.update({
        status: "Auditing",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info(`Audit ${auditId} status updated to 'Auditing'.`);

      const topicName = "score-call";
      const message = {
        json: {
          auditId: auditId,
          transcriptId: event.params.transcriptId,
        },
      };

      await pubSubClient.topic(topicName).publishMessage(message);
      logger.info(`Message published to '${topicName}' for audit ID: ${auditId}`);
    } catch (error) {
      logger.error(`Error processing audit ${auditId}:`, error);
      try {
        await auditRef.update({
          status: "Auditing Failed",
          error: "Failed to queue for auditing.",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (dbError) {
        logger.error(`Failed to update audit ${auditId} with error status:`, dbError);
      }
    }
  },
);
