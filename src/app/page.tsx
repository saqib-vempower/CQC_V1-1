'use client';

import { useState } from 'react';
import { Header } from '@/components/cqc/header';
import { CallUploadForm } from '@/components/cqc/call-upload-form';
import { RubricScorer } from '@/components/cqc/rubric-scorer';
import { AnalysisDisplay } from '@/components/cqc/analysis-display';
import { Stepper } from '@/components/cqc/stepper';

export type CallFile = {
  file: File;
  agentName: string;
  applicantId: string;
  status: 'valid' | 'invalid';
  audioDataUri?: string;
  transcript?: string;
};

export type CallData = {
  universityName: string;
  domain: string;
  callDate?: Date;
  // This will now be an array of processed files
  files: CallFile[];
  // The following fields might become specific to a selected call for analysis
  audioMetrics: string;
  timestamps: string;
  // This will hold the transcript of the currently analyzed call
  transcript: string;
  rubricScores: Record<string, number>;
  analysis?: {
    agentBehaviorAssessment: string;
    feedback: string;
  };
  coachingTips?: string[];
  // Keep track of which file is being scored/analyzed
  analyzedFile?: CallFile
};

export default function Home() {
  const [step, setStep] = useState(1);
  const [callData, setCallData] = useState<CallData>({
    universityName: '',
    domain: '',
    files: [],
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
      files: [],
      audioMetrics: '',
      timestamps: '',
      transcript: '',
      rubricScores: {},
    });
  };

  const handleSelectForAnalysis = (file: CallFile) => {
    setCallData(prev => ({
        ...prev,
        analyzedFile: file,
        transcript: file.transcript || '',
    }));
    setStep(2);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <Stepper currentStep={step} />
        <div className="mt-8">
          {step === 1 && (
            <CallUploadForm 
              setStep={setStep} 
              setCallData={setCallData}
              callData={callData}
              onSelectForAnalysis={handleSelectForAnalysis}
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
