"use client";

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
// Removed getStorage, ref, getDownloadURL imports as no longer using client-side Storage fetch
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getFirebaseServices } from "@/lib/firebase-client";
import { useAuth } from "@/context/AuthContext";

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
  // Removed top-level c1-c10, as they are nested under 'scores'
  scores: Record<ScoreKey, number | null>; // Correctly type the nested scores object
  finalCqScore: number; // This is top-level
  summary: string;
  improvementTips: string;
  transcriptId?: string;
};

// Corrected to directly reflect Firestore document structure for transcripts collection
type TranscriptDoc = {
  auditId: string;
  textSummary: string;
  utterances: {
    speaker: string;
    text: string;
    start?: number;
    end?: number;
    words?: any[]; // Keep for compatibility if present in Firestore
  }[];
  createdAt: Timestamp;
};

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
  const { db, app } = getFirebaseServices();
  const { user } = useAuth();
  // const storage = getStorage(app); // Removed client-side Storage initialization

  // Filters
  const [university, setUniversity] = React.useState<string>("all");
  const [domain, setDomain] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = React.useState<Date | undefined>(undefined);

  // Data
  const [rows, setRows] = React.useState<AuditRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Details sheets
  const [openTranscriptId, setOpenTranscriptId] = React.useState<string | null>(null);
  const [activeTranscript, setActiveTranscript] = React.useState<TranscriptDoc | null>(null); 
  const [fetchingTranscript, setFetchingTranscript] = React.useState(false); 
  const [openImprovementTipsId, setOpenImprovementTipsId] = React.useState<string | null>(null);

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

        const firestoreData = transcriptSnap.data() as TranscriptDoc; // Cast to updated type
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
  
  React.useEffect(() => {
    if (!db) return;
    setLoading(true);

    const col = collection(db, "audits");
    let constraints: any[] = [];

    if (university !== "all") constraints.push(where("university", "==", university));
    if (domain !== "all") constraints.push(where("domain", "==", domain));
    if (dateFrom) constraints.push(where("callDate", ">=", format(dateFrom, "yyyy-MM-dd")));
    if (dateTo) constraints.push(where("callDate", "<=", format(dateTo, "yyyy-MM-dd")));

    constraints.push(orderBy("callDate", "desc"));
    constraints.push(limit(50));

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


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
          <Select onValueChange={setUniversity} value={university}>
            <SelectTrigger><SelectValue placeholder="Select University" /></SelectTrigger>
            <SelectContent>{universityOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={setDomain} value={domain}>
            <SelectTrigger><SelectValue placeholder="Select Domain" /></SelectTrigger>
            <SelectContent>{domainOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP") : <span>Pick a start date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP") : <span>Pick an end date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
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
              <TableHead>App / Ref ID</TableHead>
              <TableHead>University Name</TableHead>
              <TableHead>Call Domain</TableHead>
              <TableHead>Call Type</TableHead>
              <TableHead className="sticky right-0 bg-background z-10">Transcript Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={20} className="h-24 text-center">
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
                    <TableCell>{r.status}</TableCell>
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
                    <TableCell>{r.applicantId}</TableCell>
                    <TableCell>{r.university}</TableCell>
                    <TableCell>{r.domain}</TableCell>
                    <TableCell>{r.callType}</TableCell>
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
                    <TableCell colSpan={20} className="h-24 text-center">
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
  
