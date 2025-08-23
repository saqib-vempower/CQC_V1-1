import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase-client';

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

// Client-side Firestore functions (safe to import anywhere)

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
