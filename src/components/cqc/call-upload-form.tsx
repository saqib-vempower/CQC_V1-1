'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { addDoc, collection } from 'firebase/firestore';
import { useAuth } from './auth-provider';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  file: z.any().refine((files) => files?.length > 0, 'File is required.'),
  university: z.enum(['CUA', 'RIT', 'IIT', 'SLU', 'DPU', 'RU']),
  domain: z.enum(['Reach', 'Connect', 'Support']),
  callType: z.enum(['inbound', 'outbound']),
  callDate: z.string().optional(),
});

export function CallUploadForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      console.error('No user is authenticated.');
      return;
    }

    setIsSubmitting(true);

    const file = values.file[0];
    const fileName = file.name;
    const [agentName, applicantId] = fileName.replace('.mp3', '').split('_');

    const storagePath = `uploads/${fileName}`;
    const storageRef = ref(storage, storagePath);

    try {
      await uploadBytes(storageRef, file);

      const callData = {
        fileName,
        storagePath,
        university: values.university,
        domain: values.domain,
        callType: values.callType,
        callDate: values.callDate ? new Date(values.callDate) : null,
        agentName,
        applicantId,
        status: 'Uploaded',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.uid,
      };

      const docRef = await addDoc(collection(db, 'calls'), callData);
      console.log('Document written with ID: ', docRef.id);

      form.reset();
      router.push(`/audits/${docRef.id}`);
    } catch (error) {
      console.error('Error uploading file: ', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Call Recording</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".mp3"
                  onChange={(e) => field.onChange(e.target.files)}
                />
              </FormControl>
              <FormDescription>
                Upload the call recording in .mp3 format. File name must be in the format AgentName_ApplicantID.mp3
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="university"
          render={({ field }) => (
            <FormItem>
              <FormLabel>University</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a university" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CUA">CUA - Catholic University of America</SelectItem>
                  <SelectItem value="RIT">RIT - Rochester Institute of Technology</SelectItem>
                  <SelectItem value="IIT">IIT - Illinois Institute of Technology</SelectItem>
                  <SelectItem value="SLU">SLU - Saint Louis University</SelectItem>
                  <SelectItem value="DPU">DPU - DePaul University</SelectItem>
                  <SelectItem value="RU">RU - Rockhurst University</SelectItem>
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
                  <SelectItem value="Reach">Reach</SelectItem>
                  <SelectItem value="Connect">Connect</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="callType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Call Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a call type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="callDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Call Date (Optional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Uploading...' : 'Upload and Analyze'}
        </Button>
      </form>
    </Form>
  );
}
