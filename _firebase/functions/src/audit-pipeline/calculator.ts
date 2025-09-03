// _firebase/functions/src/audit-pipeline/calculator.ts
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {db} from "../common";

type Score = number | "NA";
interface Scores {
  c1: Score; c2: Score; c3: Score; c4: Score; c5: Score;
  c6: Score; c7: Score; c8: Score; c9: Score; c10: Score;
}

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
        c1: afterData.c1, c2: afterData.c2, c3: afterData.c3,
        c4: afterData.c4, c5: afterData.c5, c6: afterData.c6,
        c7: afterData.c7, c8: afterData.c8, c9: afterData.c9,
        c10: afterData.c10,
      };

      const totalScore = Object.values(scores)
        .filter((score) => typeof score === "number")
        .reduce((sum, score) => sum + (score as number), 0);

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
