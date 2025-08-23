'use client';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UploadCloud, File as FileIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { analyzeAndStoreCall } from '@/ai/actions';

const formSchema = z.object({
  university: z.string().min(1, 'University is required'),
  domain: z.string().min(1, 'Domain is required'),
  callType: z.string().min(1, 'Call type is required'),
  audioFile: z.instanceof(File).refine(file => file.size > 0, 'An audio file is required.'),
});

type FormData = z.infer<typeof formSchema>;

export default function CallUploadForm() {
  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      university: '',
      domain: '',
      callType: '',
      audioFile: undefined,
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const audioFile = watch('audioFile');

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setValue('audioFile', acceptedFiles[0], { shouldValidate: true });
    }
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'audio/mpeg': ['.mp3'] },
    multiple: false,
  });

  const onSubmit = async (data: FormData) => {
    if (!user) {
      alert('You must be logged in to submit a call.');
      return;
    }

    setIsSubmitting(true);

    try {
      const callId = await analyzeAndStoreCall({
        ...data,
        agentId: user.uid,
      });

      router.push(`/audits/${callId}`);
    } catch (error) {
      console.error('Error processing call:', error);
      alert('An error occurred while processing the call. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Call Recording</CardTitle>
        <CardDescription>
          Select the MP3 file and enter the call details to begin the analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input id="university" {...register('university')} />
                {errors.university && <p className="text-red-500 text-xs">{errors.university.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input id="domain" {...register('domain')} />
                {errors.domain && <p className="text-red-500 text-xs">{errors.domain.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="callType">Call Type</Label>
                <Input id="callType" {...register('callType')} />
                {errors.callType && <p className="text-red-500 text-xs">{errors.callType.message}</p>}
              </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="audioFile">Audio File (MP3)</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/10' : 'border-input hover:border-primary/50'}
                ${errors.audioFile ? 'border-red-500' : ''}`}
            >
              <input {...getInputProps()} />
              {audioFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileIcon className="h-6 w-6" />
                  <span>{audioFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2">
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <p>
                    {isDragActive
                      ? 'Drop the file here ...'
                      : "Drag 'n' drop an MP3 file here, or click to select"}
                  </p>
                </div>
              )}
            </div>
            {errors.audioFile && <p className="text-red-500 text-xs">{errors.audioFile.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Submit and Analyze'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
