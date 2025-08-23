import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { adminDb } from './firebase';

// Define types
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'Admin' | 'QA' | 'Agent';
}

export interface Call {
  id: string;
  agentId: string;
  timestamp: string;
  metadata: {
    university: string;
    domain: string;
    callType: string;
  };
  analysis: {
    score: {
      overall: number;
      criteria: {
        criterion: string;
        score: number;
        maxScore: number;
        reasoning: string;
      }[];
    };
    talkTime: {
      agent: number;
      prospect: number;
      total: number;
    };
    silence: {
      total: number;
    };
    overlap: {
      total: number;
    };
    transcript: {
      speaker: 'A' | 'B';
      start: number;
      end: number;
      text: string;
    }[];
  };
}

// Client-side Firestore functions
const db = getFirestore();

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

export async function getCall(callId: string): Promise<Call | null> {
    const docRef = doc(db, 'calls', callId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as Call;
    }
    return null;
}

// Server-side Firestore functions (using admin SDK)
export async function listAllCalls(): Promise<Call[]> {
    const callsCollection = collection(adminDb, 'calls');
    const snapshot = await getDocs(callsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Call));
}

export async function saveCall(callData: Call): Promise<void> {
    const callRef = doc(adminDb, 'calls', callData.id);
    await setDoc(callRef, callData);
}
