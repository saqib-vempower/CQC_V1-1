'use client';

import * as React from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Query,
  DocumentData,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarIcon, PlayCircle, Download } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getFirebaseServices } from "@/lib/firebase-client";
import { useAuth } from "@/context/AuthContext";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ScoreKey = `c${1|2|3|4|5|6|7|8|9|10}`;

type AuditRow = {
  id: string;
  university: string;
  domain: string;
  callType?: string;
  agentName?: string;
  applicantId?: string;
  callDate?: string;
  createdAt?: Timestamp | { seconds: number; nanoseconds: number } | Date;
  status: string;
  scores: Record<ScoreKey, number | null>;
  finalCqScore: number;
  summary: string;
  improvementTips: string;
  transcriptId?: string;
  storagePath?: string;
};

type TranscriptDoc = {
  auditId: string;
  textSummary: string;
  utterances: {
    speaker: string;
    text: string;
    start?: number;
    end?: number;
    words?: any[];
  }[];
  createdAt: Timestamp;
};

type ReauditStatus = "idle" | "pending" | "success" | "error";
type ReauditState = Record<string, { status: ReauditStatus; message?: string }>;

const universityOptions = [
    { value: 'all', label: 'All Universities' },
    { value: 'CUA', label: 'CUA-Catholic University of America' },
    { value: 'RIT', label: 'RIT-Rochester Institute of Technology' },
    { value: 'IIT', label: 'IIT-Illinois Institute of Technology or Illinois Tech' },
    { value: 'SLU', label: 'SLU-Saint Louis University' },
    { value: 'DPU', label: 'DPU-DePaul University' },
    { value: 'RU', label: 'RU-Rockhurst University' },
  ];
  
  const domainOptions = [
    { value: 'all', label: 'All Domains' },
    { value: 'Support', label: 'Support' },
    { value: 'Reach', label: 'Reach' },
    { value: 'Connect', label: 'Connect' },
  ];

export default function AuditsDashboard() {
  const { db, app, storage } = getFirebaseServices();
  const { user } = useAuth();
  // Initialize functions with the correct region for reAuditCall
  const functions = React.useMemo(() => getFunctions(app, "us-central1"), [app]);
  const reAuditCallCallable = React.useMemo(() => httpsCallable(functions, 'reAuditCall'), [functions]);

  // Filters
  const [university, setUniversity] = React.useState<string>("all");
  const [domain, setDomain] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState<string>("");
  const [dateTo, setDateTo] = React.useState<string>("");

  // Data
  const [rows, setRows] = React.useState<AuditRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [reauditState, setReauditState] = React.useState<ReauditState>({});

  // Details sheets and dialogs
  const [openTranscriptId, setOpenTranscriptId] = React.useState<string | null>(null);
  const [activeTranscript, setActiveTranscript] = React.useState<TranscriptDoc | null>(null); 
  const [fetchingTranscript, setFetchingTranscript] = React.useState(false); 
  const [openImprovementTipsId, setOpenImprovementTipsId] = React.useState<string | null>(null);
  const [openSummaryId, setOpenSummaryId] = React.useState<string | null>(null);
  const [listeningState, setListeningState] = React.useState<Record<string, {loading: boolean, url?: string, error?: string}>>({});

  const fetchTranscript = React.useCallback(
    async (transcriptFirestoreId: string) => {
      if (!db) return;
      setFetchingTranscript(true);
      setActiveTranscript(null); 
      try {
        const transcriptRef = doc(db, "transcripts", transcriptFirestoreId);
        const transcriptSnap = await getDoc(transcriptRef);

        if (!transcriptSnap.exists()) {
          console.log("No such transcript document found in Firestore!");
          return;
        }

        const firestoreData = transcriptSnap.data() as TranscriptDoc;
        setActiveTranscript(firestoreData);

      } catch (error) {
        console.error("Error fetching full transcript from Firestore:", error);
        setActiveTranscript(null);
      } finally {
        setFetchingTranscript(false);
      }
    },
    [db]
  );
  
  const handleReAudit = async (auditId: string) => {
    setReauditState(prev => ({ ...prev, [auditId]: { status: 'pending' } }));
    try {
      await reAuditCallCallable({ auditId });
      setReauditState(prev => ({ ...prev, [auditId]: { status: 'success', message: 'Re-audit started!' } }));
      setTimeout(() => {
         setReauditState(prev => ({ ...prev, [auditId]: { status: 'idle' } }));
      }, 5000);
    } catch (error: any) {
      console.error('Error calling re-audit function:', error);
      setReauditState(prev => ({ ...prev, [auditId]: { status: 'error', message: error.message } }));
    }
  };

  const handleListen = async (auditId: string, storagePath: string) => {
    setListeningState(prev => ({ ...prev, [auditId]: { loading: true } }));
    try {
      const storageRef = ref(storage, storagePath);
      const url = await getDownloadURL(storageRef);
      setListeningState(prev => ({ ...prev, [auditId]: { loading: false, url: url } }));
    } catch (error: any) {
      console.error("Error getting audio download URL:", error);
      setListeningState(prev => ({ ...prev, [auditId]: { loading: false, error: "Failed to load audio." } }));
    }
  };

  React.useEffect(() => {
    if (!db) return;
    setLoading(true);

    const col = collection(db, "audits");
    let constraints: any[] = [];

    if (university !== "all") constraints.push(where("university", "==", university));
    if (domain !== "all") constraints.push(where("domain", "==", domain));
    // Using string dates directly for Firestore queries
    if (dateFrom) constraints.push(where("callDate", ">=", dateFrom));
    if (dateTo) constraints.push(where("callDate", "<=", dateTo));

    // Always sort by createdAt as requested
    constraints.push(orderBy("createdAt", "desc"));

    constraints.push(limit(1000));

    const q: Query<DocumentData> = query(col, ...constraints);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as AuditRow)
      );
      setRows(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to audits:", error);
      if (error.code === 'failed-precondition') {
        console.error("Query failed. The query may require an index. Please check the Firestore console.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, university, domain, dateFrom, dateTo]);

  const renderStatusCell = (row: AuditRow) => {
    const currentState = reauditState[row.id]?.status;

    if (currentState === 'pending') {
      return <Badge variant="secondary">Re-auditing...</Badge>;
    }
    if (currentState === 'error') {
      return (
        <div className="flex flex-col items-start">
            <Badge variant="destructive">Error</Badge>
            <Button variant="link" size="sm" onClick={() => handleReAudit(row.id)} className="p-0 h-auto mt-1 text-xs">
                Retry
            </Button>
        </div>
      );
    }
     if (currentState === 'success') {
      return <Badge variant="secondary">{reauditState[row.id]?.message}</Badge>;
    }

    return (
      <div className="flex flex-col items-start">
        <span>{row.status}</span>
        {(row.status || '').trim().toUpperCase() === "AI OVERLOADED" && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleReAudit(row.id)}
            className="mt-2"
          >
            Re-Audit
          </Button>
        )}
      </div>
    );
  };

  const handleDownloadCsv = () => {
    const headers = [
      "Agent Name",
      "Date",
      "C1 Score",
      "C2 Score",
      "C3 Score",
      "C4 Score",
      "C5 Score",
      "C6 Score",
      "C7 Score",
      "C8 Score",
      "C9 Score",
      "C10 Score",
      "Total CQ Score",
      "University Name",
      "Call Domain",
      "App / Ref ID",
    ];

    const csvRows = rows.map(row => {
      const dt =
        row.createdAt instanceof Timestamp
          ? row.createdAt.toDate()
          : row.createdAt && (row.createdAt as any).seconds !== undefined
          ? new Date((row.createdAt as any).seconds * 1000)
          : row.createdAt instanceof Date
          ? row.createdAt
          : new Date();

      const formattedDate = row.callDate ? format(new Date(row.callDate), "dd MMM yyyy") : format(dt, "dd MMM yyyy, HH:mm");

      const escapeCsv = (value: any) => {
        if (value === null || value === undefined) return '';
        let stringValue = String(value);
        // If the value contains a comma, double quote, or newline, enclose it in double quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      return [
        escapeCsv(row.agentName),
        escapeCsv(formattedDate),
        escapeCsv(row.scores?.c1 ?? 'N/A'),
        escapeCsv(row.scores?.c2 ?? 'N/A'),
        escapeCsv(row.scores?.c3 ?? 'N/A'),
        escapeCsv(row.scores?.c4 ?? 'N/A'),
        escapeCsv(row.scores?.c5 ?? 'N/A'),
        escapeCsv(row.scores?.c6 ?? 'N/A'),
        escapeCsv(row.scores?.c7 ?? 'N/A'),
        escapeCsv(row.scores?.c8 ?? 'N/A'),
        escapeCsv(row.scores?.c9 ?? 'N/A'),
        escapeCsv(row.scores?.c10 ?? 'N/A'),
        escapeCsv(row.finalCqScore ?? 'N/A'),
        escapeCsv(row.university),
        escapeCsv(row.domain),
        escapeCsv(row.applicantId),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'audits_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
          {/* Added Label for University Select */}
          <div className="grid gap-2">
            <Label htmlFor="university-select">University Name</Label>
            <Select onValueChange={setUniversity} value={university}>
              <SelectTrigger id="university-select"><SelectValue placeholder="Select University" /></SelectTrigger>
              <SelectContent>{universityOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          
          {/* Added Label for Domain Select */}
          <div className="grid gap-2">
            <Label htmlFor="domain-select">Call Domain</Label>
            <Select onValueChange={setDomain} value={domain}>
              <SelectTrigger id="domain-select"><SelectValue placeholder="Select Domain" /></SelectTrigger>
              <SelectContent>{domainOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Existing Date Pickers with Labels */}
          <div className="grid gap-2">
              <Label htmlFor="date-from">Start Date</Label>
              <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full"
              />
          </div>
          <div className="grid gap-2">
              <Label htmlFor="date-to">End Date</Label>
              <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full"
              />
          </div>
        </div>

        {/* New Download CSV Button */}
        <Button onClick={handleDownloadCsv} variant="outline" className="ml-4">
          <Download className="mr-2 h-4 w-4" /> Download CSV
        </Button>

      </div>

      <div className="overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="whitespace-nowrap">
              <TableHead>Agent Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>C1 Score</TableHead>
              <TableHead>C2 Score</TableHead>
              <TableHead>C3 Score</TableHead>
              <TableHead>C4 Score</TableHead>
              <TableHead>C5 Score</TableHead>
              <TableHead>C6 Score</TableHead>
              <TableHead>C7 Score</TableHead>
              <TableHead>C8 Score</TableHead>
              <TableHead>C9 Score</TableHead>
              <TableHead>C10 Score</TableHead>
              <TableHead>Total CQ Score</TableHead>
              <TableHead className="min-w-[240px]">Improvement tips</TableHead>
              <TableHead className="min-w-[240px]">Summary</TableHead>
              <TableHead>App / Ref ID</TableHead>
              <TableHead>University Name</TableHead>
              <TableHead>Call Domain</TableHead>
              <TableHead>Call Type</TableHead>
              <TableHead>Listen</TableHead>
              <TableHead className="sticky right-0 bg-background z-10">Transcript Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={22} className="h-24 text-center"> 
                    Loading...
                    </TableCell>
                </TableRow>
            ) : rows.length > 0 ? (
                rows.map((r) => {
                const dt =
                    r.createdAt instanceof Timestamp
                    ? r.createdAt.toDate()
                    : r.createdAt && (r.createdAt as any).seconds !== undefined
                    ? new Date((r.createdAt as any).seconds * 1000)
                    : r.createdAt instanceof Date
                    ? r.createdAt
                    : new Date();

                return (
                    <TableRow key={r.id} className="whitespace-nowrap">
                    <TableCell>{r.agentName}</TableCell>
                    <TableCell>{r.callDate ? format(new Date(r.callDate), "dd MMM yyyy") : format(dt, "dd MMM yyyy, HH:mm")}</TableCell>
                    <TableCell>{renderStatusCell(r)}</TableCell>
                    <TableCell>{r.scores?.c1 ?? 'N/A'}</TableCell>
                    <TableCell>{r.scores?.c2 ?? 'N/A'}</TableCell>
                    <TableCell>{r.scores?.c3 ?? 'N/A'}</TableCell>
                    <TableCell>{r.scores?.c4 ?? 'N/A'}</TableCell>
                    <TableCell>{r.scores?.c5 ?? 'N/A'}</TableCell>
                    <TableCell>{r.scores?.c6 ?? 'N/A'}</TableCell>
                    <TableCell>{r.scores?.c7 ?? 'N/A'}</TableCell>
                    <TableCell>{r.scores?.c8 ?? 'N/A'}</TableCell>
                    <TableCell>{r.scores?.c9 ?? 'N/A'}</TableCell>
                    <TableCell>{r.scores?.c10 ?? 'N/A'}</TableCell>
                    <TableCell className="font-semibold">{r.finalCqScore ?? 'N/A'}</TableCell>
                    <TableCell>
                        <Sheet
                        open={openImprovementTipsId === r.id}
                        onOpenChange={(o) => setOpenImprovementTipsId(o ? r.id : null)}
                        >
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm">
                            Details
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="w-[700px] sm:w-[760px] md:w-[880px] overflow-y-auto"
                        >
                            <SheetHeader>
                            <SheetTitle>
                                Improvement Tips — {r.university} / {r.domain}
                            </SheetTitle>
                            </SheetHeader>
                            <div className="mt-4 space-y-2 whitespace-pre-wrap">
                            {r.improvementTips || (
                                <p className="text-sm text-muted-foreground">
                                No improvement tips available.
                                </p>
                            )}
                            </div>
                        </SheetContent>
                        </Sheet>
                    </TableCell>
                    <TableCell>
                        <Sheet
                        open={openSummaryId === r.id}
                        onOpenChange={(o) => setOpenSummaryId(o ? r.id : null)}
                        >
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm">
                            Details
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="w-[700px] sm:w-[760px] md:w-[880px] overflow-y-auto"
                        >
                            <SheetHeader>
                            <SheetTitle>
                                Call Summary — {r.university} / {r.domain}
                            </SheetTitle>
                            </SheetHeader>
                            <div className="mt-4 space-y-2 whitespace-pre-wrap">
                            {r.summary || (
                                <p className="text-sm text-muted-foreground">
                                No summary available.
                                </p>
                            )}
                            </div>
                        </SheetContent>
                        </Sheet>
                    </TableCell>
                    <TableCell>{r.applicantId}</TableCell>
                    <TableCell>{r.university}</TableCell>
                    <TableCell>{r.domain}</TableCell>
                    <TableCell>{r.callType}</TableCell>
                    <TableCell>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!r.storagePath}
                                    onClick={() => handleListen(r.id, r.storagePath!)}
                                >
                                    <PlayCircle className="mr-2 h-4 w-4" />
                                    Listen
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                <DialogTitle>Call Recording</DialogTitle>
                                </DialogHeader>
                                {listeningState[r.id]?.loading && <p>Loading audio...</p>}
                                {listeningState[r.id]?.error && <p className="text-red-500">{listeningState[r.id]?.error}</p>}
                                {listeningState[r.id]?.url && (
                                <audio controls autoPlay src={listeningState[r.id]?.url} className="w-full">
                                    Your browser does not support the audio element.
                                </audio>
                                )}
                                <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                    Close
                                    </Button>
                                </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </TableCell>
                    <TableCell className="sticky right-0 bg-background z-10">
                    <Sheet
                        open={openTranscriptId === r.id}
                        onOpenChange={(o) => {
                            if (o && r.transcriptId) {
                            setOpenTranscriptId(r.id);
                            fetchTranscript(r.transcriptId);
                            } else {
                            setOpenTranscriptId(null);
                            setActiveTranscript(null);
                            }
                        }}
                        >
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" disabled={!r.transcriptId || fetchingTranscript}>
                                {fetchingTranscript ? "Loading..." : "Details"}
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="w-[700px] sm:w-[760px] md:w-[880px] overflow-y-auto"
                        >
                            <SheetHeader>
                            <SheetTitle>
                                Diarized Transcript — {r.university} / {r.domain}
                            </SheetTitle>
                            </SheetHeader>
                            <div className="mt-4 space-y-2">
                            {fetchingTranscript ? (
                                <p className="text-sm text-muted-foreground">Loading transcript...</p>
                            ) : activeTranscript?.utterances?.length ? (
                                activeTranscript.utterances.map((u, idx) => (
                                <div key={idx} className="text-sm leading-6">
                                    <span className="font-medium">
                                    {u.speaker ?? "Speaker"}:
                                    </span>{" "}
                                    <span>{u.text}</span>
                                    {typeof u.start === "number" ? (
                                        <span className="text-muted-foreground">
                                            {" "}
                                            ({toTime(u.start)}-
                                            {toTime(u.end ?? u.start)})
                                        </span>
                                    ) : null}
                                </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                No utterances saved or still loading.
                                </p>
                            )}
                            </div>
                        </SheetContent>
                        </Sheet>
                    </TableCell>
                    </TableRow>
                );
                })
            ) : (
                <TableRow>
                    <TableCell colSpan={22} className="h-24 text-center"> 
                    No results found.
                    </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}

function toTime(msOrSec: number) {
    const totalSeconds = msOrSec > 1000 ? Math.floor(msOrSec / 1000) : Math.floor(msOrSec);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
