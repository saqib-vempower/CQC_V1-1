
'use client';

import { useState } from 'react';
import { Header } from '@/components/cqc/header';
import { CallUploadForm } from '@/components/cqc/call-upload-form';
import { RubricScorer } from '@/components/cqc/rubric-scorer';
import { AnalysisDisplay } from '@/components/cqc/analysis-display';
import { Stepper } from '@/components/cqc/stepper';
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
  status: 'valid' | 'invalid';
  audioDataUri?: string;
  transcript?: string;
  words?: Word[];
  sentiment?: string;
};

export type CallData = {
  universityName: string;
  domain: string;
  callDate?: Date;
  // This is the file being analyzed
  analyzedFile?: CallFile
  audioMetrics: string;
  timestamps: string;
  transcript: string;
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
  const [step, setStep] = useState(1);
  const [callData, setCallData] = useState<CallData>({
    universityName: '',
    domain: '',
    audioMetrics: '',
    timestamps: '',
    transcript: '',
    rubricScores: {},
  });

  const handleReset = () => {
    setStep(1);
    // Do not reset university and domain
    setCallData(prev => ({
        ...prev,
        audioMetrics: '',
        timestamps: '',
        transcript: '',
        rubricScores: {},
        analysis: undefined,
        coachingTips: undefined,
        analyzedFile: undefined,
    }));
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header user={user} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <Stepper currentStep={step} />
        <div className="mt-8">
          {step === 1 && (
            <CallUploadForm 
              setStep={setStep} 
              setCallData={setCallData}
              callData={callData}
            />
          )}
          {step === 2 && (
            <RubricScorer
              callData={callData}
              setStep={setStep}
              setCallData={setCallData}
            />
          )}
          {step === 3 && (
            <AnalysisDisplay callData={callData} onReset={handleReset} />
          )}
        </div>
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm">
        <p>Powered by AI</p>
      </footer>
    </div>
  );
}
