// _firebase/functions/src/audit-pipeline/calculator.ts
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {db, Scores} from "../common";

export const onScored = onDocumentUpdated(
  "audits/{auditId}",
  async (event) => {
    const auditId = event.params.auditId;
    const afterData = event.data?.after.data();
    const beforeData = event.data?.before.data();

    if (afterData?.status !== "Scored" || beforeData?.status === "Scored") {
      return;
    }

    try {
      const scores: Scores = {
        c1: afterData.c1 || 0, c2: afterData.c2 || 0, c3: afterData.c3 || 0,
        c4: afterData.c4 || 0, c5: afterData.c5 || 0, c6: afterData.c6 || 0,
        c7: afterData.c7 || 0, c8: afterData.c8 || 0, c9: afterData.c9 || 0,
        c10: afterData.c10 || 0,
      };

      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
      const roundedTotalScore = parseFloat(totalScore.toFixed(2));
      logger.info(`Calculated total score for audit ${auditId}: ${roundedTotalScore}`);

      await db.collection("audits").doc(auditId).update({
        status: "Completed",
        finalCqScore: roundedTotalScore,
      });
      logger.info(`Audit ${auditId} successfully completed and updated in Firestore.`);
    } catch (error) {
      logger.error(`Error during score calculation for ${auditId}:`, error);
      await db.collection("audits").doc(auditId).update({status: "Scoring Error", error: `Scoring Error: ${(error as Error).message}`});
    }
  },
);
