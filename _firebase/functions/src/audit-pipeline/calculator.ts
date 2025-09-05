// _firebase/functions/src/audit-pipeline/calculator.ts
import {onMessagePublished} from "firebase-functions/v2/pubsub";
import * as logger from "firebase-functions/logger";
import {db} from "../common";
import * as admin from "firebase-admin";

export const onScored = onMessagePublished(
  "calculate-final-score",
  async (event) => {
    const {auditId} = event.data.message.json;
    if (!auditId) {
      logger.error("Audit ID is missing from the message.", event.data.message);
      return;
    }

    logger.info(`'onScored' function triggered for audit ID: ${auditId}`);
    const auditRef = db.collection("audits").doc(auditId);

    try {
      const auditDoc = await auditRef.get();
      if (!auditDoc.exists) {
        logger.error(`Audit document not found for ID: ${auditId}`);
        return;
      }

      const auditData = auditDoc.data();
      if (!auditData) {
        logger.error(`Audit data is undefined for ID: ${auditId}`);
        return;
      }

      const criteria = [
        "c1", "c2", "c3", "c4", "c5",
        "c6", "c7", "c8", "c9", "c10",
      ];
      let finalCqScore = 0;
      // scoredCriteriaCount is no longer needed if we are just summing

      // Access scores from the nested 'scores' object
      const individualScores = auditData.scores as Record<string, number | null | undefined>;

      for (const key of criteria) {
        const value = individualScores[key];
        if (typeof value === "number") {
          finalCqScore += value; // Simply sum the scores
        }
      }

      // Removed the division by scoredCriteriaCount as we want a sum, not an average

      await auditRef.update({
        finalCqScore: Number(finalCqScore.toFixed(2)), // Round to 2 decimal places if needed for sum
        status: "Completed",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Successfully calculated final score for audit ${auditId}. Final CQ Score: ${finalCqScore}`);
    } catch (error) {
      logger.error(`Error calculating final score for audit ${auditId}:`, error);
      try {
        await auditRef.update({
          status: "Auditing Failed",
          error: "Failed to calculate final score.",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (dbError) {
        logger.error(`Failed to update audit ${auditId} with error status:`, dbError);
      }
    }
  },
);
