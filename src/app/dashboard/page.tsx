'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageCardLayout } from "@/components/ui/PageCardLayout";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import withAuthorization from '@/components/withAuthorization';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase-client';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';

// Define the shape of our audit data
interface AuditData {
  id: string;
  agentName: string;
  applicantId: string;
  university: string;
  domain: string;
  callType: string;
  status: string;
  transcript?: string;
  transcribedAt?: Timestamp;
  // The following fields are placeholders for the Gemini audit results
  c1?: number; c2?: number; c3?: number; c4?: number; c5?: number; c6?: number; c7?: number; c8?: number; c9?: number; c10?: number;
  finalCqScore?: number;
  summary?: string;
  improvementTips?: string;
}

// Options for the dropdown filters
const universityOptions = [
  { value: 'ALL', label: 'All Universities' },
  { value: 'CUA', label: 'CUA-Catholic University of America' },
  { value: 'RIT', label: 'RIT-Rochester Institute of Technology' },
  { value: 'IIT', label: 'IIT-Illinois Institute of Technology or Illinois Tech' },
  { value: 'SLU', label: 'SLU-Saint Louis University' },
  { value: 'DPU', label: 'DPU-DePaul University' },
  { value: 'RU', label: 'RU-Rockhurst University' },
];

const domainOptions = [
    { value: 'ALL', label: 'All Domains' },
    { value: 'Support', label: 'Support' },
    { value: 'Reach', label: 'Reach' },
    { value: 'Connect', label: 'Connect' },
];

const callTypeOptions = [
    { value: 'ALL', label: 'All Call Types' },
    { value: 'Inbound', label: 'Inbound' },
    { value: 'Outbound', label: 'Outbound' },
];

function DashboardPage() {
  const router = useRouter();
  const { userRole } = useAuth();
  
  const [liveAudits, setLiveAudits] = useState<AuditData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for the details dialog
  const [selectedAudit, setSelectedAudit] = useState<AuditData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // State for filters
  const [university, setUniversity] = useState('ALL');
  const [domain, setDomain] = useState('ALL');
  const [callType, setCallType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const q = query(collection(db, "audits"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const auditsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AuditData));
      setLiveAudits(auditsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleViewDetails = (audit: AuditData) => {
    setSelectedAudit(audit);
    setIsDialogOpen(true);
  };

  const handleBack = () => {
    let path = '/';
    switch (userRole) {
      case 'Admin': path = '/admin'; break;
      case 'QA': path = '/qa'; break;
      case 'Agent': path = '/agent'; break;
      default: path = '/'; break;
    }
    router.push(path);
  };
  
  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Transcribed': return 'default';
        case 'Transcribing': return 'secondary';
        case 'Transcription Failed': return 'destructive';
        default: return 'outline';
    }
  }

  const formatTimestamp = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '-';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  }

  const filteredData = liveAudits;

  return (
    <>
      <PageCardLayout
        title="Call Audit Dashboard"
        description="A live view of call audit results. Updates will appear automatically."
        headerContent={<Button variant="outline" onClick={handleBack}>Back</Button>}
      >
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Filter UI */}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent Name</TableHead>
                <TableHead>Applicant ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completed At</TableHead>
                <TableHead>Transcript</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Loading audit data...</TableCell></TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center">No audit records found.</TableCell></TableRow>
              ) : (
                filteredData.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">{audit.agentName}</TableCell>
                    <TableCell>{audit.applicantId}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(audit.status)}>{audit.status}</Badge></TableCell>
                    <TableCell>{formatTimestamp(audit.transcribedAt)}</TableCell>
                    <TableCell className="max-w-xs truncate">{audit.transcript || 'Not available'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(audit)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </PageCardLayout>

      {selectedAudit && (
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Audit Details</AlertDialogTitle>
              <AlertDialogDescription>
                Full transcript for the call between {selectedAudit.agentName} and {selectedAudit.applicantId}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-4">
              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                {selectedAudit.transcript || "No transcript available."}
              </p>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setIsDialogOpen(false)}>Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

export default withAuthorization(DashboardPage, ['Admin', 'QA', 'Agent']);
