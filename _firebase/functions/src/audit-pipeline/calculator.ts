// _firebase/functions/src/audit-pipeline/calculator.ts
import {onDocumentUpdated, FirestoreEvent, Change, QueryDocumentSnapshot} from "firebase-functions/v2/firestore";
import {logger} from "firebase-functions";
import {db} from "../common";
import {ScoreKey} from "../ai/responseSchema";

// This function calculates the final weighted score based on the raw scores from the AI
// and the weights defined in the rubric.
function computeFinalScore(
  scores: Record<ScoreKey, number | null>,
  weights: Record<string, number>
) {
  let sumWeights = 0;
  let sumPoints = 0;
  (Object.keys(scores) as ScoreKey[]).forEach((k) => {
    const v = scores[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      const w = Number(weights[k] ?? 0);
      sumWeights += w;
      sumPoints += v;
    }
  });
  if (sumWeights <= 0) return 0;
  return Math.round((sumPoints / sumWeights) * 100);
}

export const onScored = onDocumentUpdated(
  {
    document: "audits/{auditId}",
    region: "us-central1",
  },
  async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined, { auditId: string; }>) => {
    const auditId = event.params.auditId;
    const after = event.data?.after.data() as any;

    try {
      if (!after || after.status !== "Scored") return;

      // Load rubric v1.0
      const rSnap = await db.collection("rubrics").doc("v1.0").get();
      if (!rSnap.exists) {
        throw new Error("Rubric v1.0 not found in Firestore (rubrics/v1.0). Please seed it first.");
      }
      const rubric = rSnap.data() as any;

      // Pre-compute weights { c1: 10, ... } (case-insensitive)
      const weights: Record<string, number> = Object.fromEntries(
        Object.entries(rubric?.criteria ?? {}).map(([k, v]: any) => [
          String(k).toLowerCase(), Number(v?.weight ?? 0),
        ])
      );

      const finalCqScore = computeFinalScore(after.scores, weights);

      await db.collection("audits").doc(auditId).set({
        finalCqScore,
        status: "Completed",
        updatedAt: new Date(),
      }, {merge: true});
      logger.info(`[audit:${auditId}] Marked as completed.`);
    } catch (e) {
      logger.error(`[audit:${auditId}] Calculator failed: ${String(e)}`);
      await db.collection("audits").doc(auditId).set({
        status: "Failed",
        error: {message: String(e)},
        updatedAt: new Date(),
      }, {merge: true});
    }
  }
);
