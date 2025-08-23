
'use server';

import { analyzeCallFlow, AnalyzeCallInput } from './flows/analyze-call-flow';
import { v4 as uuidv4 } from 'uuid';
import { adminStorage } from '@/lib/firebase-server';
import { adminDb } from '@/lib/firebase-server';
import { Call } from '@/lib/firestore';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';


interface UploadAndAnalyzeInput extends Omit<AnalyzeCallInput, 'audioGcsUri'> {
    audioFile: File;
}

// This function is called from the client-side component
export async function analyzeAndStoreCall(input: UploadAndAnalyzeInput): Promise<string> {
    const { audioFile, ...metadata } = input;
    const callId = uuidv4();
    
    // 1. Upload file to GCS
    const bucket = adminStorage.bucket();
    const filePath = `uploads/${callId}/${audioFile.name}`;
    const fileRef = bucket.file(filePath);

    const fileBuffer = Buffer.from(await audioFile.arrayBuffer());
    
    await fileRef.save(fileBuffer, {
        metadata: {
            contentType: audioFile.type,
        },
    });

    const audioGcsUri = `gs://${bucket.name}/${filePath}`;
    
    // 2. Trigger the Genkit analysis flow
    const analysisResult = await analyzeCallFlow({ ...metadata, audioGcsUri });

    // 3. Store the complete record in Firestore
    const callRecord: Call = {
        id: callId,
        agentId: metadata.agentId,
        timestamp: new Date().toISOString(),
        metadata: {
            university: metadata.university,
            domain: metadata.domain,
            callType: metadata.callType,
        },
        analysis: analysisResult
    };

    await saveCall(callRecord);

    return callId;
}

// Server-side Firestore functions (using admin SDK)
export async function listAllCalls(): Promise<Call[]> {
    const callsCollection = collection(adminDb, 'calls');
    const snapshot = await getDocs(callsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Call));
}

export async function saveCall(callData: Call): Promise<void> {
    const callRef = doc(adminDb, 'calls', callData.id);
    await setDoc(callRef, callData as any);
}
