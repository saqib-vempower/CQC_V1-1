// _firebase/functions/src/audit-pipeline/processor.ts
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {logger} from "firebase-functions";
import {db} from "../common";

export const onAiAuditing = onDocumentUpdated(
  {
    document: "audits/{auditId}",
    region: "us-central1",
  },
  async (event) => {
    const auditId = event.params.auditId;
    const after = event.data?.after.data() as any;
    const before = event.data?.before.data() as any;

    try {
      // Only run once when we have a transcript and haven't scored yet
      if (!after || after.status !== "Transcribed") return;
      if (before?.scores && after?.scores) return;

      // Set the status to "Scoring" to trigger the next step
      await db.collection("audits").doc(auditId).set({
        status: "Scoring",
        updatedAt: new Date(),
      }, {merge: true});

      logger.info(`[audit:${auditId}] Status updated to Scoring.`);
    } catch (err) {
      logger.error(`[audit:${auditId}] Audit failed: ${String(err)}`);
      await db.collection("audits").doc(auditId).set({
        status: "Failed",
        error: {message: String(err)},
        updatedAt: new Date(),
      }, {merge: true});
    }
  }
);
