'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageCardLayout } from "@/components/ui/PageCardLayout"; // Import the new layout
import withAuthorization from '@/components/withAuthorization';
import { useAuth } from '@/context/AuthContext';
import { getFirebaseServices } from '@/lib/firebase-client';
import { ref, uploadBytes } from 'firebase/storage';
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

type Status = 'idle' | 'loading' | 'success' | 'error';

function ToolPage() {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [university, setUniversity] = useState('');
  const [domain, setDomain] = useState('');
  const [callType, setCallType] = useState('');
  const [callDate, setCallDate] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  
  const [status, setStatus] = useState<Status>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const resetForm = () => {
    setUniversity('');
    setDomain('');
    setCallType('');
    setCallDate('');
    setFiles(null);
    const fileInput = document.getElementById('call-files') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      setStatus('idle');
      setStatusMessage('');
      const fileNameRegex = /^[a-zA-Z0-9]+_[a-zA-Z0-9]+\.mp3$/;
      for (let i = 0; i < selectedFiles.length; i++) {
        if (!fileNameRegex.test(selectedFiles[i].name)) {
          setStatus('error');
          setStatusMessage(`Invalid file name: ${selectedFiles[i].name}. Expected AgentName_ApplicantID.mp3`);
          setFiles(null);
          return;
        }
      }
      setFiles(selectedFiles);
    }
  };

  const handleUpload = async () => {
    if (!university || !domain || !callType || !files) {
      setStatus('error');
      setStatusMessage('Please fill all required fields and select files.');
      return;
    }
    if (!user) {
      setStatus('error');
      setStatusMessage('You must be logged in to upload files.');
      return;
    }

    setStatus('loading');
    setUploadProgress(0);
    const { storage, db } = getFirebaseServices();
    const filesArray = Array.from(files);
    const totalFiles = filesArray.length;
    setStatusMessage(`Uploading ${uploadProgress} of ${totalFiles} files...`);

    try {
      const uploadPromises = filesArray.map(async (file, index) => {
        const [agentName, applicantId] = file.name.replace('.mp3', '').split('_');
        const uniqueFilename = `${agentName}_${applicantId}_${Date.now()}.mp3`;
        const storagePath = `audits/${uniqueFilename}`;
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, file);
        
        await addDoc(collection(db, 'audits'), {
          agentName, applicantId, university, domain, callType,
          callDate: callDate || null,
          originalFilename: file.name,
          storagePath, status: 'Uploaded',
          createdAt: serverTimestamp(),
          uploadedBy: user.email,
        });

        const newProgress = index + 1;
        setUploadProgress(newProgress);
        setStatusMessage(`Uploading ${newProgress} of ${totalFiles} files...`);
      });

      await Promise.all(uploadPromises);

      setStatus('success');
      setStatusMessage(`${totalFiles} file(s) uploaded successfully!`);
      resetForm();

    } catch (err) {
      console.error("Upload failed:", err);
      setStatus('error');
      setStatusMessage('An error occurred during the upload. Please try again.');
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
  
  const getStatusChip = () => {
    if (status === 'idle' || !statusMessage) return null;
    
    let variant: "default" | "destructive" | "secondary" = "default";
    if (status === 'success') variant = 'secondary';
    if (status === 'error') variant = 'destructive';
    
    return (
        <div className="mt-4 flex justify-center">
            <Badge variant={variant} className="text-md px-4 py-2">
                {statusMessage}
            </Badge>
        </div>
    );
  }

  return (
    <PageCardLayout
      title="Call Auditing Tool"
      description="Upload call recordings (MP3 format) and provide metadata for auditing."
      headerContent={<Button variant="outline" onClick={handleBack} disabled={status === 'loading'}>Back</Button>}
    >
      <div className="grid gap-6">
        <fieldset disabled={status === 'loading'}>
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
        
        {getStatusChip()}

        <div className="mt-4 grid grid-cols-1 gap-2">
          <Button onClick={handleUpload} className="w-full" disabled={status === 'loading' || !files || status === 'error'}>
            {status === 'loading' ? 'Uploading...' : 'Upload and Audit Calls'}
          </Button>
          <Link href="/dashboard" passHref>
            <Button variant="secondary" className="w-full" disabled={status === 'loading'}>
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </PageCardLayout>
  );
}

export default withAuthorization(ToolPage, ['Admin', 'QA']);
