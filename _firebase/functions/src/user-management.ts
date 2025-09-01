// _firebase/functions/src/user-management.ts
import * as admin from "firebase-admin";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

export const onLogin = onDocumentWritten(
  {
    document: "users/{userId}",
    region: "us-central1", // Set region to match Firestore
  },
  async (event) => {
    const userId = event.params.userId;
    const before = event.data?.before.exists ? event.data.before.data() : undefined;
    const after = event.data?.after.exists ? event.data.after.data() : undefined;

    const oldRole = before?.role;
    const newRole = after?.role;

    if (!after) {
      await admin.auth().setCustomUserClaims(userId, null);
      logger.info(`Removed claims for deleted user ${userId}`);
      return;
    }
    if (oldRole === newRole) return;

    await admin.auth().setCustomUserClaims(userId, {role: newRole});
    await event.data!.after.ref.update({claimsUpdatedAt: admin.firestore.FieldValue.serverTimestamp()});
    logger.info(`Set role=${newRole} for user ${userId}`);
  }
);
