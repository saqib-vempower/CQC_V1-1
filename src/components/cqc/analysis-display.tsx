'use client';

import { format } from 'date-fns';
import { Download, FileText, Lightbulb, MessageSquareQuote, RotateCcw, User, University, FileAudio } from 'lucide-react';
import type { CallData } from '@/app/page';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '../ui/badge';

type AnalysisDisplayProps = {
  callData: CallData;
  onReset: () => void;
};

export function AnalysisDisplay({ callData, onReset }: AnalysisDisplayProps) {
  const { analysis, coachingTips, transcript, universityName, domain, callDate, rubricScores, analyzedFile } = callData;
  
  const handleExport = () => {
    // This is a placeholder for a real export implementation
    const dataToExport = {
      ...callData,
      files: callData.files.map(f => ({...f, file: f.file.name, audioDataUri: 'omitted for brevity'})),
      analyzedFile: callData.analyzedFile ? {...callData.analyzedFile, file: callData.analyzedFile.file.name, audioDataUri: 'omitted for brevity'} : undefined
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `call_analysis_${analyzedFile?.agentName}_${analyzedFile?.applicantId}_${new Date().toISOString()}.json`;

    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <Card className="shadow-lg">
        <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="font-headline text-2xl">Call Analysis Report</CardTitle>
                <CardDescription className="mt-1">
                  Showing results for agent <Badge>{analyzedFile?.agentName}</Badge>
                </CardDescription>
              </div>
              <div className="flex gap-2 self-start md:self-center">
                <Button onClick={handleExport} variant="outline">
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button onClick={onReset} variant="secondary">
                  <RotateCcw className="mr-2 h-4 w-4" /> Start Over
                </Button>
              </div>
            </div>
            <Separator className="!my-4" />
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <FileAudio className="w-4 h-4 text-muted-foreground" />
                    <strong>File:</strong>
                    <span>{analyzedFile?.file.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <strong>Applicant ID:</strong>
                    <span>{analyzedFile?.applicantId}</span>
                </div>
                <div className="flex items-center gap-2">
                    <University className="w-4 h-4 text-muted-foreground" />
                    <strong>University:</strong>
                    <span>{universityName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <strong>Domain:</strong>
                    <span>{domain}</span>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-4">
                <MessageSquareQuote className="w-6 h-6 text-accent" />
                <CardTitle className="text-lg">Agent Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/80">{analysis?.agentBehaviorAssessment || "No assessment generated."}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-4">
                <Lightbulb className="w-6 h-6 text-accent" />
                <CardTitle className="text-lg">AI Coaching Tips</CardTitle>
              </CardHeader>
              <CardContent>
                {coachingTips && coachingTips.length > 0 ? (
                  <ul className="space-y-3 text-sm text-foreground/80">
                    {coachingTips.map((tip, index) => <li key={index} className="flex items-start gap-2"><span className="text-accent mt-1">&#8226;</span><span>{tip}</span></li>)}
                  </ul>
                ) : (
                  <p>No coaching tips generated.</p>
                )}
              </CardContent>
            </Card>
          </div>
          <Separator className="my-6" />
          <Accordion type="multiple" className="w-full space-y-4">
             <AccordionItem value="rubric">
              <AccordionTrigger className="font-semibold text-base">Rubric Scores</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
                  {Object.entries(rubricScores).map(([key, value]) => (
                    <div key={key} className="flex flex-col items-center justify-center p-4 border rounded-lg bg-background">
                       <p className="text-sm text-muted-foreground">{key}</p>
                       <p className="text-3xl font-bold text-primary">{value}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="transcript">
              <AccordionTrigger className="font-semibold text-base">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <span>Call Transcript</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-72 w-full rounded-md border p-4 bg-muted/30">
                  <pre className="text-sm whitespace-pre-wrap font-body">{transcript || "No transcript available."}</pre>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
