'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageCardLayout } from "@/components/ui/PageCardLayout";
import withAuthorization from '@/components/withAuthorization';
import { useAuth } from '@/context/AuthContext';
import { getFirebaseServices } from '@/lib/firebase-client';
import { ref, uploadBytes } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { PageLayout } from '@/components/ui/PageLayout';

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

const parseFileName = (fileName: string) => {
  const parts = fileName.replace('.mp3', '').split('_');
  
  // Slate format: AgentName_ApplicantId.mp3
  if (parts.length === 2) {
    return {
      agentName: parts[0],
      applicantId: parts[1],
      callDate: null,
    };
  } 
  
  // Verve format: University_Agent_..._YYYYMMDD_..._MediaID_...mp3
  // Example: slu_Ismat_11268_7509632291_1753177405492_20250801_120319_AD080120251203123584_7509632291.mp3
  if (parts.length > 8) {
    const agentName = parts[1]; // 2nd token
    const yyyymmdd = parts[5]; // 6th token
    const applicantId = parts[7]; // 8th token
    
    // Format YYYYMMDD to YYYY-MM-DD for the date input
    const formattedDate = `${yyyymmdd.substring(0, 4)}-${yyyymmdd.substring(4, 6)}-${yyyymmdd.substring(6, 8)}`;

    return { agentName, applicantId, callDate: formattedDate };
  }

  return null; // Invalid format
};


function ToolPage() {
  const { user } = useAuth();
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
      
      let extractedDate: string | null = null;

      for (let i = 0; i < selectedFiles.length; i++) {
        const parsedData = parseFileName(selectedFiles[i].name);
        if (!parsedData) {
          setStatus('error');
          setStatusMessage(`Invalid file name: ${selectedFiles[i].name}. Please use a supported format.`);
          setFiles(null);
          return;
        }

        // If date is not manually set and we find a date in a Verve file, use it.
        if (!callDate && parsedData.callDate && !extractedDate) {
            extractedDate = parsedData.callDate;
        }
      }

      if (extractedDate) {
        setCallDate(extractedDate);
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
    setStatusMessage(`Uploading 0 of ${totalFiles} files...`);

    try {
      const uploadPromises = filesArray.map(async (file, index) => {
        const parsedData = parseFileName(file.name);
        if (!parsedData) {
          // This check is redundant due to handleFileChange but good for safety
          throw new Error(`Skipping invalid file: ${file.name}`);
        }

        const { agentName, applicantId } = parsedData;

        const newAuditDocRef = await addDoc(collection(db, 'audits'), {
          agentName,
          applicantId,
          university,
          domain,
          callType,
          callDate: callDate || null,
          originalFilename: file.name,
          status: 'Uploading',
          createdAt: serverTimestamp(),
          uploadedBy: user.email,
        });
        const auditId = newAuditDocRef.id;

        const uniqueFilenameWithId = `${auditId}-${agentName}_${applicantId}_${Date.now()}.mp3`;
        const storagePath = `audits/${uniqueFilenameWithId}`;

        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, file);

        await updateDoc(newAuditDocRef, {
          storagePath: storagePath,
          status: 'Uploaded',
        });

        const newProgress = index + 1;
        setUploadProgress(newProgress);
        setStatusMessage(`Uploaded ${newProgress} of ${totalFiles} files...`);
      });

      await Promise.all(uploadPromises);

      setStatus('success');
      setStatusMessage(`${totalFiles} file(s) uploaded successfully! Processing will continue in the background.`);
      resetForm();

    } catch (err) {
      console.error("Upload process failed:", err);
      setStatus('error');
      setStatusMessage('Upload Error: An error occurred during the upload. Please try again.');
    }
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
    <PageLayout centered showBackButton={true}>
      <PageCardLayout
        title="Call Auditing Tool"
        description="Upload call recordings (MP3 format) and provide metadata for auditing."
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
                <p className="text-sm text-gray-500">Do not select any date for files from Contaque Verve</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="call-files">Call Recording Files</Label>
                <Input id="call-files" type="file" accept=".mp3,audio/mpeg" multiple onChange={handleFileChange} />
                <p className="text-sm text-gray-500" style={{ lineHeight: '1.5' }}>
                  Supported: <br />
                  From Slate: AgentName_ApplicantID.mp3 <br />
                  From Contaque Verve: UniversitySlug_AgentName_InternalID_Phone_EpochMS_YYYYMMDD_HHMMSS_MediaID_Phone.mp3
                </p>
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
    </PageLayout>
  );
}

export default withAuthorization(ToolPage, ['Admin', 'QA']);
