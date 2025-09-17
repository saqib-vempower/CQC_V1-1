// _firebase/functions/src/index.ts
import * as admin from "firebase-admin";

// This file is the entrypoint for Firebase Functions.
// It exports all the 2nd Gen functions from their individual files.

admin.initializeApp();

export {onCallUpload} from "./audit-pipeline/initiator";
export {onAiTranscripting} from "./audit-pipeline/receiver";
export {onAiAuditing} from "./audit-pipeline/processor";
export {onScored} from "./audit-pipeline/calculator";
export {onLogin} from "./user-management";
export {scoreCall} from "./ai/scoreCall";
export {reAuditCall} from "./audit-pipeline/reAudit"; // Export the new reAuditCall function