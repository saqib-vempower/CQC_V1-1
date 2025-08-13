
'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, UploadCloud, FileCheck2, FileX2, ChevronsRight } from 'lucide-react';
import type { CallData, CallFile } from '@/components/cqc/dashboard';
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
  audioFile: z
    .custom<File>((val) => val instanceof File, 'Please upload a file.')
    .refine(
      (file) => file.type.startsWith('audio/'),
      'The file must be an audio file.'
    )
    .refine(
        (file) => file.name.endsWith('.mp3') || file.name.endsWith('.wav'),
        'The file must be in .mp3 or .wav format.'
    ),
});

type CallUploadFormProps = {
  setStep: Dispatch<SetStateAction<number>>;
  setCallData: Dispatch<SetStateAction<CallData>>;
  callData: CallData;
};

export function CallUploadForm({ setStep, setCallData, callData }: CallUploadFormProps) {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      universityName: callData.universityName || '',
      domain: callData.domain || '',
      callDate: callData.callDate,
    },
  });
  
  const selectedFile = form.watch('audioFile');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('audioFile', file);
    }
  };
  
  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const fileName = values.audioFile.name.endsWith('.mp3') 
        ? values.audioFile.name.replace('.mp3', '') 
        : values.audioFile.name.replace('.wav', '');
    const parts = fileName.split('_');
    
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        toast({
            variant: 'destructive',
            title: 'Invalid Filename Format',
            description: "Please ensure the audio file is named 'AgentName_ApplicantID'.",
        });
        return;
    }
    
    const audioDataUri = await toBase64(values.audioFile);

    const callFile: CallFile = {
      file: values.audioFile,
      agentName: parts[0],
      applicantId: parts[1],
      status: 'valid',
      audioDataUri,
    };
    
    setCallData((prev) => ({
      ...prev,
      universityName: values.universityName,
      domain: values.domain,
      callDate: values.callDate,
      analyzedFile: callFile,
    }));
    
    setStep(2);
  };

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Upload Call Details</CardTitle>
        <CardDescription>
          Provide call information and upload an audio file for analysis.
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
                        </Trigger>
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
                        </Trigger>
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
              name="audioFile"
              render={() => (
                <FormItem>
                    <FormLabel>Audio File</FormLabel>
                    <FormControl>
                        <div className="relative flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-border hover:border-primary transition-colors">
                            <div className="space-y-1 text-center">
                                <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground" />
                                <div className="flex text-sm text-muted-foreground items-center justify-center">
                                    <label htmlFor="audioFile" className={cn("text-primary cursor-pointer font-semibold")}>
                                        <span>Upload file</span>
                                        <Input
                                            id="audioFile"
                                            type="file"
                                            accept=".mp3,.wav"
                                            className="sr-only"
                                            onChange={handleFileChange}
                                        />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-muted-foreground">.mp3, .wav file in 'AgentName_ApplicantID' format</p>
                            </div>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />

            {selectedFile && (
              <div>
                <h3 className="text-sm font-medium mb-2">Selected File:</h3>
                <div className="space-y-2 rounded-md border p-3 flex items-center">
                   <FileCheck2 className="w-4 h-4 text-green-500 mr-2" />
                   <p className="text-sm font-medium">{selectedFile.name}</p>
                </div>
              </div>
            )}
            
            <Separator />
            
            <Button type="submit" disabled={!selectedFile} className="w-full">
              Next: Score Rubric
              <ChevronsRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
