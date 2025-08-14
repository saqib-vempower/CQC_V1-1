
'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, UploadCloud, FileCheck2, ChevronsRight, Loader2, Bot, FileText, CheckCircle2, XCircle } from 'lucide-react';
import type { CallData, CallFile } from '@/app/audits/page';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '../ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '../ui/progress';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { scoreRubric } from '@/ai/flows/score-rubric';
import { analyzeCallTranscript } from '@/ai/flows/analyze-call-transcript';
import { generateCoachingTips } from '@/ai/flows/generate-coaching-tips';
import { storeCallRecord } from '@/ai/flows/store-call-record';
import { Badge } from '../ui/badge';


const universities = [
  { abbr: 'CUA', name: 'Catholic University of America' },
  { abbr: 'RIT', name: 'Rochester Institute of Technology' },
  { abbr: 'IIT', name: 'Illinois Institute of Technology' },
  { abbr: 'SLU', name: 'Saint Louis University' },
  { abbr: 'DPU', name: 'DePaul University' },
  { abbr: 'RU', name: 'Rockhurst University' },
];

const domains = ['Support', 'Reach', 'Connect'];

const formSchema = z.object({
  universityName: z.string().min(2, { message: 'University name is required.' }),
  domain: z.string().min(2, { message: 'Domain is required.' }),
  callDate: z.date().optional(),
  audioFiles: z
    .custom<FileList>((val) => val instanceof FileList, 'Please upload at least one file.')
    .refine((files) => files.length > 0, 'Please upload at least one file.')
    .refine(
      (files) => Array.from(files).every((file) => file.type.startsWith('audio/')),
      'All files must be audio files.'
    )
    .refine(
        (files) => Array.from(files).every((file) => file.name.endsWith('.mp3') || file.name.endsWith('.wav')),
        'All files must be in .mp3 or .wav format.'
    ),
});

type CallUploadFormProps = {
  setCallData: Dispatch<SetStateAction<CallData>>;
  callData: CallData;
};

type FileStatus = 'pending' | 'transcribing' | 'scoring' | 'analyzing' | 'complete' | 'error';

interface ProcessedFile extends CallFile {
    status: FileStatus;
    errorMessage?: string;
}

export function CallUploadForm({ setCallData, callData }: CallUploadFormProps) {
  const { toast } = useToast();
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      universityName: callData.universityName || '',
      domain: callData.domain || '',
      callDate: callData.callDate || new Date(),
    },
  });

  const selectedFiles = form.watch('audioFiles');

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
  
  const updateFileStatus = (index: number, status: FileStatus, errorMessage?: string) => {
      setProcessedFiles(prev => {
          const newFiles = [...prev];
          if (newFiles[index]) {
            newFiles[index] = { ...newFiles[index], status, errorMessage };
          }
          return newFiles;
      });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsAuditing(true);
    setOverallProgress(0);

    const filesToProcess: ProcessedFile[] = Array.from(values.audioFiles).map(file => {
        const fileName = file.name.endsWith('.mp3') ? file.name.replace('.mp3', '') : file.name.replace('.wav', '');
        const parts = fileName.split('_');
        const isValid = parts.length === 2 && parts[0] && parts[1];

        return {
            file,
            agentName: isValid ? parts[0] : 'Unknown',
            applicantId: isValid ? parts[1] : 'Unknown',
            status: isValid ? 'pending' : 'error',
            errorMessage: isValid ? undefined : "Invalid filename. Must be 'AgentName_ApplicantID'.",
        };
    });

    const validFilesToProcess = filesToProcess.filter(f => f.status !== 'error');
    const invalidFiles = filesToProcess.filter(f => f.status === 'error');
    
    setProcessedFiles([...validFilesToProcess, ...invalidFiles]);

    for (let i = 0; i < validFilesToProcess.length; i++) {
        const currentFile = validFilesToProcess[i];
        
        const originalIndex = filesToProcess.findIndex(pf => pf.file.name === currentFile.file.name);

        try {
            updateFileStatus(originalIndex, 'transcribing');
            const audioDataUri = await toBase64(currentFile.file);
            const transcriptionResult = await transcribeAudio({ audioDataUri });
            if (!transcriptionResult || !transcriptionResult.transcript) {
                throw new Error('Transcription failed to produce a result.');
            }

            updateFileStatus(originalIndex, 'scoring');
            const scoringResult = await scoreRubric({ transcript: transcriptionResult.transcript });

            updateFileStatus(originalIndex, 'analyzing');
            const analysisResult = await analyzeCallTranscript({
                transcript: transcriptionResult.transcript,
                audioMetrics: "N/A",
                rubricScores: JSON.stringify(scoringResult.rubricScores),
            });

            const coachingTipsResult = await generateCoachingTips({
                rubricScores: scoringResult.rubricScores,
                transcript: transcriptionResult.transcript,
                timestamps: [],
                universityName: values.universityName,
                domain: values.domain,
                callDate: values.callDate ? format(values.callDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
            });
            
            await storeCallRecord({
                userId: 'public_user', // Since auth is removed
                universityName: values.universityName,
                domain: values.domain,
                callDate: values.callDate ? format(values.callDate, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
                fileName: currentFile.file.name,
                agentName: currentFile.agentName,
                applicantId: currentFile.applicantId,
                transcript: transcriptionResult.transcript,
                sentiment: transcriptionResult.sentiment,
                rubricScores: scoringResult.rubricScores,
                analysis: analysisResult,
                coachingTips: coachingTipsResult.coachingTips,
            });

            updateFileStatus(originalIndex, 'complete');
        } catch (error) {
            console.error(`Failed processing ${currentFile.file.name}:`, error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred.';
            updateFileStatus(originalIndex, 'error', message);
        }
        
        setOverallProgress(((i + 1) / validFilesToProcess.length) * 100);
    }

    toast({ title: 'Batch Auditing Complete', description: 'All files have been processed.' });
    setIsAuditing(false);
  };
  
  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
        case 'pending': return <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />;
        case 'transcribing': return <FileText className="w-4 h-4 text-blue-500 animate-pulse" />;
        case 'scoring':
        case 'analyzing': return <Bot className="w-4 h-4 text-orange-500 animate-pulse" />;
        case 'complete': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        case 'error': return <XCircle className="w-4 h-4 text-destructive" />;
    }
  };
  
  const getStatusText = (status: FileStatus) => {
      const map: Record<FileStatus, string> = {
          pending: 'Pending...',
          transcribing: 'Transcribing...',
          scoring: 'Scoring...',
          analyzing: 'Analyzing...',
          complete: 'Complete',
          error: 'Error'
      };
      return map[status];
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Start New Audit</CardTitle>
        <CardDescription>
          Select university, domain, and upload audio files for automated analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="universityName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University Name</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isAuditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a university" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {universities.map(uni => (
                            <SelectItem key={uni.abbr} value={uni.name}>
                                <div className="flex items-center">
                                <span className="font-bold w-12">{uni.abbr}</span>
                                <span className="text-xs text-muted-foreground">{uni.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isAuditing}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a domain" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {domains.map(domain => (
                          <SelectItem key={domain} value={domain}>
                            {domain}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="callDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Call Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          disabled={isAuditing}
                          className={cn(
                            'w-[240px] pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Date of Call</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="audioFiles"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Audio Files</FormLabel>
                    <FormControl>
                        <div className="relative flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-border hover:border-primary transition-colors">
                            <div className="space-y-1 text-center">
                                <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground" />
                                <div className="flex text-sm text-muted-foreground items-center justify-center">
                                    <label htmlFor="audioFiles" className={cn("text-primary cursor-pointer font-semibold", isAuditing && "cursor-not-allowed opacity-50")}>
                                        <span>Upload files</span>
                                        <Input
                                            id="audioFiles"
                                            type="file"
                                            accept=".mp3,.wav"
                                            className="sr-only"
                                            multiple
                                            disabled={isAuditing}
                                            onChange={(e) => field.onChange(e.target.files)}
                                        />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-muted-foreground">.mp3, .wav files in 'AgentName_ApplicantID' format</p>
                            </div>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />

            {selectedFiles && selectedFiles.length > 0 && !isAuditing && (
              <div>
                <h3 className="text-sm font-medium mb-2">Selected Files ({selectedFiles.length}):</h3>
                <div className="space-y-2 rounded-md border p-3 max-h-40 overflow-y-auto">
                    {Array.from(selectedFiles).map((file, i) => (
                        <div key={i} className="flex items-center">
                            <FileCheck2 className="w-4 h-4 text-green-500 mr-2" />
                            <p className="text-sm font-medium">{file.name}</p>
                        </div>
                    ))}
                </div>
              </div>
            )}
            
            <Separator />
            
            <Button type="submit" disabled={!selectedFiles || selectedFiles.length === 0 || isAuditing} className="w-full">
              {isAuditing ? <Loader2 className="animate-spin" /> : <ChevronsRight />}
              {isAuditing ? `Auditing... (${Math.round(overallProgress)}%)` : `Start Auditing (${selectedFiles?.length || 0} files)`}
            </Button>
          </form>
        </Form>
        {isAuditing && (
            <div className="mt-6">
                <Progress value={overallProgress} className="w-full" />
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                    {processedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                           <div className='flex items-center gap-2'>
                             {getStatusIcon(file.status)}
                             <div>
                               <p className="text-sm font-medium">{file.file.name}</p>
                               {file.errorMessage && <p className="text-xs text-destructive">{file.errorMessage}</p>}
                             </div>
                           </div>
                           <Badge variant={file.status === 'complete' ? 'default' : file.status === 'error' ? 'destructive' : 'secondary'} className={cn(file.status === 'complete' && 'bg-green-600')}>{getStatusText(file.status)}</Badge>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
