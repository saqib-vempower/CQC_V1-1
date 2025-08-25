'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import withAuthorization from '@/components/withAuthorization';
import { useAuth } from '@/context/AuthContext';
import { storage, db } from '@/lib/firebase-client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const universityOptions = [
  { value: 'CUA', label: 'CUA-Catholic University of America' },
  { value: 'RIT', label: 'RIT-Rochester Institute of Technology' },
  { value: 'IIT', label: 'IIT-Illinois Institute of Technology or Illinois Tech' },
  { value: 'SLU', label: 'SLU-Saint Louis University' },
  { value: 'DPU', label: 'DPU-DePaul University' },
  { value: 'RU', label: 'RU-Rockhurst University' },
];

const domainOptions = [
  { value: 'Support', label: 'Support' },
  { value: 'Reach', label: 'Reach' },
  { value: 'Connect', label: 'Connect' },
];

const callTypeOptions = [
  { value: 'Inbound', label: 'Inbound' },
  { value: 'Outbound', label: 'Outbound' },
];

function ToolPage() {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [university, setUniversity] = useState('');
  const [domain, setDomain] = useState('');
  const [callType, setCallType] = useState('');
  const [callDate, setCallDate] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const resetForm = () => {
    setUniversity('');
    setDomain('');
    setCallType('');
    setCallDate('');
    setFiles(null);
    // This is a common way to reset a file input
    const fileInput = document.getElementById('call-files') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      setError('');
      setFeedback('');
      const fileNameRegex = /^[a-zA-Z0-9]+_[a-zA-Z0-9]+\.mp3$/;
      for (let i = 0; i < selectedFiles.length; i++) {
        if (!fileNameRegex.test(selectedFiles[i].name)) {
          setError(`Invalid file name format: ${selectedFiles[i].name}. Expected AgentName_ApplicantID.mp3`);
          setFiles(null);
          return;
        }
      }
      setFiles(selectedFiles);
    }
  };

  const handleUpload = async () => {
    if (!university || !domain || !callType || !files) {
      setError('Please fill all required fields and select files.');
      return;
    }
    if (!user) {
      setError('You must be logged in to upload files.');
      return;
    }

    setIsLoading(true);
    setError('');
    setFeedback('');
    setUploadProgress(0);

    const filesArray = Array.from(files);
    const totalFiles = filesArray.length;

    try {
      const uploadPromises = filesArray.map(async (file, index) => {
        const [agentName, applicantId] = file.name.replace('.mp3', '').split('_');
        const uniqueFilename = `${agentName}_${applicantId}_${Date.now()}.mp3`;
        const storagePath = `audits/${uniqueFilename}`;
        const storageRef = ref(storage, storagePath);

        // 1. Upload the file
        await uploadBytes(storageRef, file);
        
        // 2. Create the Firestore document
        await addDoc(collection(db, 'audits'), {
          agentName,
          applicantId,
          university,
          domain,
          callType,
          callDate: callDate || null,
          originalFilename: file.name,
          storagePath,
          status: 'Uploaded',
          createdAt: serverTimestamp(),
          uploadedBy: user.email,
        });

        // Update progress
        setUploadProgress(prev => prev + 1);
      });

      await Promise.all(uploadPromises);

      setFeedback(`${totalFiles} file(s) uploaded and records created successfully!`);
      resetForm();

    } catch (err) {
      console.error("Upload failed:", err);
      setError('An error occurred during the upload. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    let path = '/';
    switch (userRole) {
      case 'Admin': path = '/admin'; break;
      case 'QA': path = '/qa'; break;
      default: path = '/'; break;
    }
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="mx-auto w-full max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Call Auditing Tool</CardTitle>
              <Button variant="outline" onClick={handleBack} disabled={isLoading}>Back</Button>
            </div>
            <CardDescription>
              Upload call recordings (MP3 format) and provide metadata for auditing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <fieldset disabled={isLoading}>
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="university-name">University Name</Label>
                    <Select onValueChange={setUniversity} value={university}>
                      <SelectTrigger><SelectValue placeholder="Select University" /></SelectTrigger>
                      <SelectContent>{universityOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="call-domain">Call Domain</Label>
                    <Select onValueChange={setDomain} value={domain}>
                      <SelectTrigger><SelectValue placeholder="Select Domain" /></SelectTrigger>
                      <SelectContent>{domainOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="call-type">Call Type</Label>
                    <Select onValueChange={setCallType} value={callType}>
                      <SelectTrigger><SelectValue placeholder="Select Call Type" /></SelectTrigger>
                      <SelectContent>{callTypeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="call-date">Date of Call (Optional)</Label>
                    <Input id="call-date" type="date" value={callDate} onChange={e => setCallDate(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="call-files">Call Recording Files</Label>
                    <Input id="call-files" type="file" accept=".mp3,audio/mpeg" multiple onChange={handleFileChange} />
                    <p className="text-sm text-gray-500">File naming format: AgentName_ApplicantID.mp3</p>
                  </div>
                </div>
              </fieldset>
              
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              {feedback && <p className="text-green-600 text-sm mt-2">{feedback}</p>}
              {isLoading && (
                <div className="mt-2 text-center text-sm text-gray-600">
                  <p>Uploading... {uploadProgress} of {files?.length || 0} files completed.</p>
                </div>
              )}

              <div className="mt-4 grid grid-cols-1 gap-2">
                <Button onClick={handleUpload} className="w-full" disabled={isLoading || !files || !!error}>
                  {isLoading ? 'Uploading...' : 'Upload and Audit Calls'}
                </Button>
                <Link href="/dashboard" passHref>
                  <Button variant="secondary" className="w-full" disabled={isLoading}>
                    Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withAuthorization(ToolPage, ['Admin', 'QA']);
