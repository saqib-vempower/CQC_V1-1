'use server';

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import { scoreRubricFlow } from './score-rubric';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

exports.triggerScoring = onDocumentCreated('/calls/{callId}/metrics/data', async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log('No data associated with the event');
        return;
    }

    const callId = event.params.callId;
    const callDocRef = db.collection('calls').doc(callId);
    const transcriptDocRef = db.collection('calls').doc(callId).collection('transcript').doc('data');

    try {
        await callDocRef.update({ status: 'Scoring' });

        const transcriptDoc = await transcriptDocRef.get();
        const transcriptData = transcriptDoc.data();

        if (!transcriptData) {
            throw new Error('Transcript data not found.');
        }

        const result = await scoreRubricFlow.run({
            transcript: transcriptData.fullText,
        });
        
        // Calculate the overall weighted score
        let totalScore = 0;
        let totalWeight = 0;
        result.criteria.forEach(c => {
            if (c.score !== 'N/A') {
                totalScore += c.score * c.weight;
                totalWeight += c.weight;
            }
        });
        result.overallScore = totalWeight > 0 ? (totalScore / totalWeight) : 0;
        
        await db.collection('calls').doc(callId).collection('score').doc('data').set(result);
        await callDocRef.update({ status: 'Scored' });

        console.log('Scoring successful.');

    } catch (error) {
        console.error('Error during scoring:', error);
        await callDocRef.update({ status: 'Error' });
    }
});
