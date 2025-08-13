
'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { analyzeCallTranscript } from '@/ai/flows/analyze-call-transcript';
import { generateCoachingTips } from '@/ai/flows/generate-coaching-tips';
import { storeCallRecord } from '@/ai/flows/store-call-record';
import { FileAudio, Loader2, User, University } from 'lucide-react';
import type { CallData } from '@/components/cqc/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { useAuth } from '@/components/cqc/auth-provider';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { Skeleton } from '../ui/skeleton';

const rubricItems = [
  'Opening', 'Active Listening', 'Problem Solving', 'Professionalism', 'Closing'
];

type RubricScorerProps = {
  callData: CallData;
  setStep: Dispatch<SetStateAction<number>>;
  setCallData: Dispatch<SetStateAction<CallData>>;
};

export function RubricScorer({ callData, setStep, setCallData }: RubricScorerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(true);
  const { user } = useAuth();
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initialScores: Record<string, number> = {};
    rubricItems.forEach(item => initialScores[item] = 3);
    return initialScores;
  });
  const [audioMetrics, setAudioMetrics] = useState(callData.audioMetrics || '');
  const [timestamps, setTimestamps] = useState(callData.timestamps || '');
  const { toast } = useToast();

  useEffect(() => {
    const runTranscription = async () => {
        if (!callData.analyzedFile?.audioDataUri) {
             toast({
                variant: 'destructive',
                title: 'Transcription Error',
                description: 'Could not find the audio file data to transcribe.',
            });
            setIsTranscribing(false);
            return;
        }

        try {
            setIsTranscribing(true);
            const transcriptionResult = await transcribeAudio({ audioDataUri: callData.analyzedFile.audioDataUri });
            if (!transcriptionResult || !transcriptionResult.transcript) {
                throw new Error(`Transcription failed for ${callData.analyzedFile.file.name}.`);
            }
            setCallData(prev => ({
                ...prev,
                transcript: transcriptionResult.transcript,
                analyzedFile: prev.analyzedFile ? {
                    ...prev.analyzedFile,
                    sentiment: transcriptionResult.sentiment,
                    transcript: transcriptionResult.transcript,
                    words: transcriptionResult.words,
                } : undefined,
            }));
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Transcription Failed',
                description: error instanceof Error ? error.message : 'The audio could not be transcribed.',
            });
        } finally {
            setIsTranscribing(false);
        }
    }
    runTranscription();
  }, [callData.analyzedFile, setCallData, toast]);

  const handleScoreChange = (item: string, value: number[]) => {
    setScores(prev => ({...prev, [item]: value[0]}));
  };

  const parseTimestamps = (timestampsStr: string) => {
    if (!timestampsStr.trim()) return [];
    return timestampsStr.split('\n').map(line => {
      const parts = line.split(':');
      const timePart = parts.pop() || '';
      const segment = parts.join(':').trim();
      const [startTime, endTime] = timePart.split('-').map(t => t.trim());
      return { segment, startTime: startTime || '00:00:00', endTime: endTime || '00:00:00' };
    }).filter(t => t.segment);
  };
  
  async function onSubmit() {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'You must be logged in to save an analysis.',
        });
        return;
    }
    if (!callData.transcript) {
        toast({
            variant: 'destructive',
            title: 'Missing Transcript',
            description: 'Cannot proceed without a call transcript.',
        });
        return;
    }

    setIsAnalyzing(true);
    try {
      const currentCallData = { 
        ...callData, 
        rubricScores: scores,
        audioMetrics,
        timestamps 
      };
      setCallData(currentCallData);
      
      const analysisResult = await analyzeCallTranscript({
        transcript: currentCallData.transcript,
        audioMetrics: audioMetrics,
        rubricScores: JSON.stringify(scores),
      });

      const parsedTimestamps = parseTimestamps(timestamps);

      const coachingTipsResult = await generateCoachingTips({
        rubricScores: scores,
        transcript: currentCallData.transcript,
        timestamps: parsedTimestamps,
        universityName: currentCallData.universityName,
        domain: currentCallData.domain,
        callDate: currentCallData.callDate ? format(currentCallData.callDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
      });

      if (!analysisResult || !coachingTipsResult) {
        throw new Error('Failed to get analysis or coaching tips.');
      }
      
      await storeCallRecord({
        userId: user.uid,
        universityName: currentCallData.universityName,
        domain: currentCallData.domain,
        callDate: currentCallData.callDate ? format(currentCallData.callDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
        fileName: currentCallData.analyzedFile?.file.name || 'unknown',
        agentName: currentCallData.analyzedFile?.agentName || 'unknown',
        applicantId: currentCallData.analyzedFile?.applicantId || 'unknown',
        transcript: currentCallData.transcript,
        rubricScores: scores,
        audioMetrics: audioMetrics,
        timestamps: parsedTimestamps,
        analysis: analysisResult,
        coachingTips: coachingTipsResult.coachingTips,
        sentiment: currentCallData.analyzedFile?.sentiment || 'NEUTRAL',
      });

      setCallData(prev => ({
        ...prev,
        analysis: analysisResult,
        coachingTips: coachingTipsResult.coachingTips
      }));

      toast({
        title: "Analysis Complete & Saved",
        description: "AI analysis and coaching tips have been generated and saved to your records.",
      });

      setStep(3);

    } catch (error) {
       console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: error instanceof Error ? error.message : 'Could not analyze and save the call. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  const renderLoadingSkeleton = () => (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-20 w-full" />
            </div>
        </div>
        <Separator />
        <div className="space-y-6">
            {rubricItems.map(item => (
                <div key={item} className="space-y-3">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-5 w-full" />
                </div>
            ))}
        </div>
        <Skeleton className="h-10 w-full" />
    </div>
  );

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Score The Call</CardTitle>
        <CardDescription>
          You are scoring the call for agent <Badge variant="outline">{callData.analyzedFile?.agentName}</Badge>. 
          Use the rubric below to score performance on a scale of 1 to 5.
        </CardDescription>
        <Separator className="!my-4" />
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-muted-foreground" />
                <strong>File:</strong>
                <span>{callData.analyzedFile?.file.name}</span>
            </div>
             <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <strong>Applicant ID:</strong>
                <span>{callData.analyzedFile?.applicantId}</span>
            </div>
            <div className="flex items-center gap-2">
                <University className="w-4 h-4 text-muted-foreground" />
                <strong>University:</strong>
                <span>{callData.universityName}</span>
            </div>
             <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <strong>Domain:</strong>
                <span>{callData.domain}</span>
            </div>
        </div>

      </CardHeader>
      <CardContent>
        {isTranscribing ? renderLoadingSkeleton() : (
            <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor='audioMetrics'>Audio Metrics (Optional)</Label>
                    <Textarea
                        id="audioMetrics"
                        placeholder="Enter audio metrics like pauses, holds, audio quality scores..."
                        className="resize-none mt-2"
                        value={audioMetrics}
                        onChange={(e) => setAudioMetrics(e.target.value)}
                    />
                </div>
                <div>
                    <Label htmlFor='timestamps'>Notable Timestamps (Optional)</Label>
                    <Textarea
                        id="timestamps"
                        placeholder="e.g. Long pause: 00:32-00:40&#10;Agent interruption: 01:15-01:17"
                        className="resize-none mt-2"
                        value={timestamps}
                        onChange={(e) => setTimestamps(e.target.value)}
                    />
                </div>
            </div>

            <Separator />

            <div className="space-y-6">
            {rubricItems.map(item => (
                <div key={item} className="grid gap-4">
                <div className="flex justify-between items-center">
                    <Label htmlFor={item} className="text-base">{item}</Label>
                    <span className="w-12 text-center font-bold text-lg text-primary bg-primary/10 rounded-md py-1">{scores[item]}</span>
                </div>
                <Slider
                    id={item}
                    min={1}
                    max={5}
                    step={1}
                    value={[scores[item]]}
                    onValueChange={(value) => handleScoreChange(item, value)}
                />
                </div>
            ))}
            </div>
            <Button onClick={onSubmit} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? (
                <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Insights...
                </>
            ) : (
                'Generate Coaching & View Results'
            )}
            </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
