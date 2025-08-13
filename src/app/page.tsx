'use client';

import { useState } from 'react';
import { Header } from '@/components/cqc/header';
import { CallUploadForm } from '@/components/cqc/call-upload-form';
import { RubricScorer } from '@/components/cqc/rubric-scorer';
import { AnalysisDisplay } from '@/components/cqc/analysis-display';
import { Stepper } from '@/components/cqc/stepper';

export type CallData = {
  universityName: string;
  domain: string;
  callDate?: Date;
  audioFile?: File;
  audioDataUri?: string;
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

export default function Home() {
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
    setCallData({
      universityName: '',
      domain: '',
      audioMetrics: '',
      timestamps: '',
      transcript: '',
      rubricScores: {},
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <Stepper currentStep={step} />
        <div className="mt-8">
          {step === 1 && (
            <CallUploadForm setStep={setStep} setCallData={setCallData} />
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
