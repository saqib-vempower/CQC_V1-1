// _firebase/functions/src/audit-pipeline/initiator.ts
import {onObjectFinalized} from "firebase-functions/v2/storage";
import * as logger from "firebase-functions/logger";
import {AssemblyAI} from "assemblyai";
import * as admin from "firebase-admin";
import {getStorage} from "firebase-admin/storage";
import {db, AAI_KEY, AAI_WEBHOOK} from "../common";

const storage = getStorage();

export const onCallUpload = onObjectFinalized(
  {
    secrets: [AAI_KEY, AAI_WEBHOOK],
    region: "asia-south2",
  },
  async (event) => {
    // Add a check to ensure the secret is loaded.
    if (!process.env.ASSEMBLYAI_API_KEY) {
      logger.error("ASSEMBLYAI_API_KEY secret is not loaded.");
      throw new Error("ASSEMBLYAI_API_KEY secret is not available.");
    }

    const {bucket: bucketName, name: filePath, contentType, metadata} = event.data;

    if (!contentType?.startsWith("audio/")) {
      logger.info(`File ${filePath} is not an audio file, skipping.`);
      return;
    }

    const university = metadata?.university || "Unknown";
    const domain = metadata?.domain || "Unknown";

    const file = storage.bucket(bucketName).file(filePath);
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires,
    });

    try {
      // The check above guarantees the key is a string.
      const client = new AssemblyAI({apiKey: process.env.ASSEMBLYAI_API_KEY});
      const projectId = admin.app().options.projectId;
      const webhookUrl = `https://us-central1-${projectId}.cloudfunctions.net/onAiTranscripting`;

      const transcript = await client.transcripts.create({
        audio_url: signedUrl,
        speaker_labels: true,
        webhook_url: webhookUrl,
        webhook_auth_header_name: "x-webhook-secret",
        webhook_auth_header_value: process.env.ASSEMBLYAI_WEBHOOK_SECRET,
      });

      await db.collection("audits").doc(transcript.id).set({
        status: "Transcribing",
        createdAt: new Date(),
        filePath: filePath,
        university: university,
        domain: domain,
      });

      logger.info(`Transcript ${transcript.id} for [${university}/${domain}] submitted for ${filePath}.`);
    } catch (error) {
      logger.error(`Failed to submit transcript for ${filePath}:`, error);
      await db.collection("audits").add({
        status: "Failed",
        error: "Failed to submit to AssemblyAI.",
        createdAt: new Date(),
        filePath: filePath,
        university: university,
        domain: domain,
      });
    }
  },
);
