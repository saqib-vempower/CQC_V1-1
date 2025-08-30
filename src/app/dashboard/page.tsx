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
import { getFirebaseServices } from '@/lib/firebase-client';
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
  // This will now store the formatted string for display
  completedAt: string; 
  // The following fields are placeholders for the Gemini audit results
  c1?: number; c2?: number; c3?: number; c4?: number; c5?: number; c6?: number; c7?: number; c8?: number; c9?: number; c10?: number;
  finalCqScore?: number;
  summary?: string;
  improvementTips?: string;
  transcript?: string; // Keep transcript optional if it might not always be there
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

  // Helper to format Firebase Timestamp to a display string
  const formatFirebaseTimestamp = (timestamp: Timestamp | undefined): string => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  useEffect(() => {
    const { db } = getFirebaseServices();
    const q = query(collection(db, "audits"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const auditsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          agentName: data.agentName || 'N/A',
          applicantId: data.applicantId || 'N/A',
          university: data.university || 'N/A',
          domain: data.domain || 'N/A',
          callType: data.callType || 'N/A',
          status: data.status || 'N/A',
          transcript: data.transcript || '',
          // Use the auditedAt timestamp for the completion time
          completedAt: formatFirebaseTimestamp(data.auditedAt),
          c1: data.c1, c2: data.c2, c3: data.c3, c4: data.c4, c5: data.c5, 
          c6: data.c6, c7: data.c7, c8: data.c8, c9: data.c9, c10: data.c10,
          finalCqScore: data.finalCqScore,
          summary: data.summary,
          improvementTips: data.improvementTips,
        } as AuditData;
      });
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
  
  // Corrected getStatusVariant to use only existing Badge variants
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case 'Transcribed': return 'default';
        case 'Auditing': return 'secondary';
        case 'Completed': return 'default'; // Mapped 'Completed' to 'default'
        case 'Transcription Failed':
        case 'Auditing Failed': return 'destructive';
        default: return 'outline';
    }
  }

  const filteredData = liveAudits;

  // Calculate the total number of columns for the table header/body
  const totalTableColumns = 7; // AgentName, ApplicantId, Status, Completed At, Final Score, Transcript, Actions

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
                <TableHead>Final Score</TableHead>
                <TableHead>Transcript</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={totalTableColumns} className="text-center">Loading audit data...</TableCell></TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow><TableCell colSpan={totalTableColumns} className="text-center">No audit records found.</TableCell></TableRow>
              ) : (
                filteredData.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">{audit.agentName}</TableCell>
                    <TableCell>{audit.applicantId}</TableCell>
                    <TableCell><Badge variant={getStatusVariant(audit.status)}>{audit.status}</Badge></TableCell>
                    <TableCell>{audit.completedAt}</TableCell> 
                    <TableCell>{audit.finalCqScore !== undefined ? audit.finalCqScore : 'N/A'}</TableCell>
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
          <AlertDialogContent className="max-w-4xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Audit Details for {selectedAudit.agentName} ({selectedAudit.applicantId})</AlertDialogTitle>
              <AlertDialogDescription>
                Full audit results including transcript and NLP analysis.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Transcript:</h3>
                <p className="text-sm text-gray-800 whitespace-pre-wrap border p-2 rounded-md bg-gray-50">
                  {selectedAudit.transcript || "No transcript available."}
                </p>
              </div>

              {selectedAudit.finalCqScore !== undefined && (
                <div>
                  <h3 className="font-semibold mb-2">Overall Quality Score:</h3>
                  <p className="text-base font-bold text-blue-700">{selectedAudit.finalCqScore} / 100</p>
                </div>
              )}

              {selectedAudit.summary && (
                <div>
                  <h3 className="font-semibold mb-2">Summary:</h3>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap border p-2 rounded-md">
                    {selectedAudit.summary}
                  </p>
                </div>
              )}

              {selectedAudit.improvementTips && (
                <div>
                  <h3 className="font-semibold mb-2">Improvement Tips:</h3>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap border p-2 rounded-md">
                    {selectedAudit.improvementTips}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(cNum => {
                  const score = selectedAudit[`c${cNum}` as keyof AuditData];
                  if (score !== undefined) {
                    return (
                      <div key={`c${cNum}`}>
                        <h4 className="font-medium">C{cNum} Score:</h4>
                        <p className="text-sm">{score} / 5</p>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
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
