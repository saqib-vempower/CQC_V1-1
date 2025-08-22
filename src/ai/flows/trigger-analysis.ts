'use server';

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { analyzeCallTranscriptFlow } from './analyze-call-transcript';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

exports.triggerAnalysis = onDocumentCreated('/calls/{callId}/transcript/data', async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log('No data associated with the event');
    return;
  }
  const data = snapshot.data();
  const callId = event.params.callId;
  const callDocRef = db.collection('calls').doc(callId);

  try {
    await callDocRef.update({ status: 'Analyzing' });

    const result = await analyzeCallTranscriptFlow.run({
      utterances: data.utterances,
    });

    await db.collection('calls').doc(callId).collection('metrics').doc('data').set(result);
    await callDocRef.update({ status: 'Analyzed' });

    console.log('Analysis successful.');
  } catch (error) {
    console.error('Error during analysis:', error);
    await callDocRef.update({ status: 'Error' });
  }
});
