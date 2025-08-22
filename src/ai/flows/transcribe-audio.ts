'use server';

import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { AssemblyAI } from 'assemblyai';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const storage = getStorage();

exports.transcribeAudio = onObjectFinalized({ cpu: 2 }, async (event) => {
  const fileBucket = event.bucket;
  const filePath = event.data.name;
  const contentType = event.data.contentType;

  if (!contentType?.startsWith('audio/')) {
    console.log('This is not an audio file.');
    return;
  }

  if (!filePath.startsWith('uploads/')) {
    console.log('This is not a new upload.');
    return;
  }

  const fileName = filePath.split('/').pop();
  if (!fileName) {
    console.error('Could not extract file name from path.');
    return;
  }

  const callsRef = db.collection('calls');
  const query = callsRef.where('fileName', '==', fileName);
  const snapshot = await query.get();

  if (snapshot.empty) {
    console.log('No matching call document found.');
    return;
  }

  const callDoc = snapshot.docs[0];
  const callId = callDoc.id;

  try {
    await callDoc.ref.update({ status: 'Transcribing' });

    const bucket = storage.bucket(fileBucket);
    const file = bucket.file(filePath);
    const [audioData] = await file.download();

    const client = new AssemblyAI({
      apiKey: process.env.ASSEMBLYAI_API_KEY,
    });

    const transcript = await client.transcripts.transcribe({
      audio: audioData,
      speaker_labels: true,
    });

    if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }

    const transcriptData = {
      fullText: transcript.text,
      utterances: transcript.utterances?.map((u) => ({
        speaker: u.speaker,
        text: u.text,
        start: u.start,
        end: u.end,
      })),
    };

    await db.collection('calls').doc(callId).collection('transcript').doc('data').set(transcriptData);
    await callDoc.ref.update({ status: 'Transcribed' });

    console.log('Transcription successful.');
  } catch (error) {
    console.error('Error during transcription:', error);
    await callDoc.ref.update({ status: 'Error' });
  }
});
