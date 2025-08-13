'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, UploadCloud, FileCheck2, FileX2, ChevronsRight, Info } from 'lucide-react';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import type { CallData, CallFile } from '@/app/page';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

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
    .array(z.custom<File>())
    .refine((files) => files.length > 0, 'At least one audio file is required.')
    .refine(
      (files) => files.every((file) => file.type.startsWith('audio/')),
      'All files must be audio files.'
    )
    .refine(
        (files) => files.every((file) => file.name.endsWith('.mp3')),
        'All files must be .mp3 format.'
    ),
});

type CallUploadFormProps = {
  setStep: Dispatch<SetStateAction<number>>;
  setCallData: Dispatch<SetStateAction<CallData>>;
  callData: CallData;
  onSelectForAnalysis: (file: CallFile) => void;
};

export function CallUploadForm({ setStep, setCallData, callData, onSelectForAnalysis }: CallUploadFormProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedFiles, setTranscribedFiles] = useState<string[]>([]);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      universityName: callData.universityName || '',
      domain: callData.domain || '',
      callDate: callData.callDate,
      audioFiles: [],
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      const files = Array.from(fileList);
      const processedFiles: CallFile[] = files.map(file => {
        const parts = file.name.replace('.mp3', '').split('_');
        if (parts.length === 2 && parts[0] && parts[1]) {
          return {
            file,
            agentName: parts[0],
            applicantId: parts[1],
            status: 'valid'
          };
        }
        return { file, agentName: '', applicantId: '', status: 'invalid' };
      });
      form.setValue('audioFiles', files); // for validation
      setCallData(prev => ({ ...prev, files: processedFiles }));
    }
  };
  
  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsTranscribing(true);
    setTranscribedFiles([]);
    
    setCallData((prev) => ({
      ...prev,
      universityName: values.universityName,
      domain: values.domain,
      callDate: values.callDate,
    }));

    const validFiles = callData.files.filter(f => f.status === 'valid');

    try {
        const transcriptionPromises = validFiles.map(async (callFile) => {
        const audioDataUri = await toBase64(callFile.file);
        const transcriptionResult = await transcribeAudio({ audioDataUri });
        
        if (!transcriptionResult || !transcriptionResult.transcript) {
            throw new Error(`Transcription failed for ${callFile.file.name}.`);
        }

        setCallData(prev => ({
            ...prev,
            files: prev.files.map(f => f.file.name === callFile.file.name ? { ...f, transcript: transcriptionResult.transcript, audioDataUri } : f)
        }));
        setTranscribedFiles(prev => [...prev, callFile.file.name]);
        return { ...callFile, transcript: transcriptionResult.transcript };
      });

      await Promise.all(transcriptionPromises);

      toast({
        title: "All transcriptions complete!",
        description: "You can now select a call to analyze.",
      });

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred during transcription',
        description: error instanceof Error ? error.message : 'Could not transcribe one or more files. Please try again.',
      });
    } finally {
      setIsTranscribing(false);
    }
  }

  const { ref: fileRef, ...fileRest } = form.register("audioFiles");

  return (
    <Card className="max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Upload Call Details</CardTitle>
        <CardDescription>
          Provide call information and upload one or more audio files for transcription.
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
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <FormLabel>Call Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-[240px] pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
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
              render={() => (
                <FormItem>
                    <FormLabel>Audio Files</FormLabel>
                    <FormControl>
                        <div className="relative flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-border hover:border-primary transition-colors">
                            <div className="space-y-1 text-center">
                                <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground" />
                                <div className="flex text-sm text-muted-foreground items-center justify-center">
                                    <label htmlFor="audioFiles" className={cn("text-primary cursor-pointer font-semibold")}>
                                        <span>Upload files</span>
                                        <Input
                                            id="audioFiles"
                                            type="file"
                                            accept=".mp3"
                                            multiple
                                            className="sr-only"
                                            onChange={handleFileChange}
                                            {...fileRest}
                                        />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-muted-foreground">.mp3 files in 'AgentName_ApplicantID.mp3' format</p>
                            </div>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />

            {callData.files.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Uploaded Files:</h3>
                <div className="space-y-2 rounded-md border">
                    {callData.files.map((callFile, index) => (
                        <div key={index} className="flex items-center p-3">
                            <div className="flex-1">
                                <p className="text-sm font-medium">{callFile.file.name}</p>
                                {callFile.status === 'valid' ? (
                                    <div className='flex gap-2 items-center'>
                                        <FileCheck2 className="w-4 h-4 text-green-500" />
                                        <p className="text-xs text-muted-foreground">
                                            Agent: <span className="font-semibold text-foreground">{callFile.agentName}</span>, Applicant ID: <span className="font-semibold text-foreground">{callFile.applicantId}</span>
                                        </p>
                                    </div>
                                ) : (
                                    <div className='flex gap-2 items-center'>
                                      <FileX2 className="w-4 h-4 text-destructive" />
                                      <p className="text-xs text-destructive">Invalid filename format</p>
                                    </div>
                                )}
                            </div>
                            <div className="w-48 text-right">
                                {isTranscribing && callFile.status === 'valid' && !transcribedFiles.includes(callFile.file.name) && (
                                    <Badge variant="secondary" className="animate-pulse">
                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                        Transcribing...
                                    </Badge>
                                )}
                                {transcribedFiles.includes(callFile.file.name) && callFile.transcript && (
                                     <Button size="sm" onClick={() => onSelectForAnalysis(callFile)}>
                                        Analyze
                                        <ChevronsRight className="h-4 w-4 ml-2" />
                                    </Button>
                                )}
                                {callFile.status === 'invalid' && (
                                    <Badge variant="destructive">Invalid</Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
              </div>
            )}
            
            <Separator />
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Next Steps</AlertTitle>
              <AlertDescription>
                After uploading, you must transcribe the files. You can then select a transcribed call to proceed with scoring and analysis.
              </AlertDescription>
            </Alert>
            
            <Button type="submit" disabled={isTranscribing || callData.files.filter(f => f.status === 'valid').length === 0} className="w-full">
              {isTranscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Auditing {transcribedFiles.length}/{callData.files.filter(f => f.status === 'valid').length}...
                </>
              ) : (
                `Start Auditing ${callData.files.filter(f => f.status === 'valid').length} Valid File(s)`
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
