
'use client';

import { useState } from 'react';
import { Header } from '@/components/cqc/header';
import { CallUploadForm } from '@/components/cqc/call-upload-form';
import type { User } from 'firebase/auth';

export type Word = {
    text: string;
    start: number;
    end: number;
    speaker: string | null;
};

export type CallFile = {
  file: File;
  agentName: string;
  applicantId: string;
  status: 'valid' | 'invalid' | 'pending' | 'transcribing' | 'scoring' | 'analyzing' | 'complete' | 'error';
  audioDataUri?: string;
  transcript?: string;
  words?: Word[];
  sentiment?: string;
  errorMessage?: string;
};

export type CallData = {
  universityName: string;
  domain: string;
  callDate?: Date;
  files: CallFile[];
  rubricScores: Record<string, number>;
  analysis?: {
    agentBehaviorAssessment: string;
    feedback: string;
  };
  coachingTips?: string[];
};

type DashboardProps = {
    user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const [callData, setCallData] = useState<CallData>({
    universityName: '',
    domain: '',
    files: [],
    rubricScores: {},
  });


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header user={user} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mt-8">
            <CallUploadForm 
              setCallData={setCallData}
              callData={callData}
            />
        </div>
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm">
        <p>Powered by AI</p>
      </footer>
    </div>
  );
}
