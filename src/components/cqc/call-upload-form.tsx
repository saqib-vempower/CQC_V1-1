'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, UploadCloud } from 'lucide-react';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import type { CallData } from '@/app/page';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  universityName: z.string().min(2, { message: 'University name is required.' }),
  domain: z.string().min(2, { message: 'Domain is required.' }),
  callDate: z.date({ required_error: 'A call date is required.' }),
  audioFile: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, 'Audio file is required.')
    .refine((files) => files?.[0]?.type.startsWith('audio/'), 'Must be an audio file.')
    .refine((files) => files?.[0]?.size <= 10 * 1024 * 1024, 'Max file size is 10MB.'),
  audioMetrics: z.string().optional(),
  timestamps: z.string().optional(),
});

type CallUploadFormProps = {
  setStep: Dispatch<SetStateAction<number>>;
  setCallData: Dispatch<SetStateAction<CallData>>;
};

export function CallUploadForm({ setStep, setCallData }: CallUploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      universityName: '',
      domain: '',
      audioMetrics: '',
      timestamps: '',
    },
  });

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const audioFile = values.audioFile[0];
      const audioDataUri = await toBase64(audioFile);

      setCallData((prev) => ({
        ...prev,
        universityName: values.universityName,
        domain: values.domain,
        callDate: values.callDate,
        audioFile: audioFile,
        audioDataUri: audioDataUri,
        audioMetrics: values.audioMetrics ?? '',
        timestamps: values.timestamps ?? '',
      }));

      const transcriptionResult = await transcribeAudio({ audioDataUri });

      if (!transcriptionResult || !transcriptionResult.transcript) {
        throw new Error('Transcription failed. The response did not contain a transcript.');
      }
      
      setCallData((prev) => ({
        ...prev,
        transcript: transcriptionResult.transcript,
      }));
      
      toast({
        title: "Transcription Successful",
        description: "The audio file has been transcribed.",
      });

      setStep(2);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: error instanceof Error ? error.message : 'Could not transcribe the audio. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const fileRef = form.register("audioFile");

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Upload Call Details</CardTitle>
        <CardDescription>
          Start by uploading the call audio and providing some basic information.
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
                    <FormControl>
                      <Input placeholder="e.g. Grand Canyon University" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="e.g. Admissions" {...field} />
                    </FormControl>
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
              name="audioFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audio File</FormLabel>
                  <FormControl>
                    <div className="relative flex justify-center w-full h-32 px-6 pt-5 pb-6 border-2 border-dashed rounded-md border-border hover:border-primary transition-colors">
                      <div className="space-y-1 text-center">
                        <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground" />
                        <div className="flex text-sm text-muted-foreground items-center justify-center">
                          <label htmlFor="audioFile" className={cn(buttonVariants({ variant: 'link', size: 'sm' }), "text-primary cursor-pointer")}>
                            <span>Upload a file</span>
                             <Input
                                id="audioFile"
                                type="file"
                                accept="audio/*"
                                className="sr-only"
                                {...fileRef}
                              />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                         <p className="text-xs text-muted-foreground">{form.watch('audioFile')?.[0]?.name || 'Audio files up to 10MB'}</p>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="audioMetrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audio Metrics (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter audio metrics like pauses, holds, audio quality scores..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This data would typically be generated automatically by services like Assembly AI.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timestamps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notable Timestamps (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Long pause: 00:32-00:40&#10;Agent interruption: 01:15-01:17"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    One event per line. This helps AI to generate more specific coaching tips.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transcribing...
                </>
              ) : (
                'Transcribe & Proceed'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
