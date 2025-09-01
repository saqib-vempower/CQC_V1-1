"use client";

import * as React from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  Timestamp,
} from "firebase/firestore";
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

type AuditRow = {
  id: string;
  university: string;
  domain: string;
  agentName?: string;
  createdAt?: Timestamp | { seconds: number; nanoseconds: number } | Date;
  status:
    | "Uploaded"
    | "Transcribing"
    | "Auditing"
    | "Completed"
    | "Auditing Failed"
    | "Transcription Failed";
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
  c6: number;
  c7: number;
  c8: number;
  c9: number;
  c10: number;
  finalCqScore: number;
  summary: string;
  improvementTips: string;
  utterances?: {
    speaker: string;
    text: string;
    start?: number;
    end?: number;
  }[];
};

const PAGE_SIZE = 25;

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
  const { db } = getFirebaseServices();
  const { user } = useAuth();

  // Filters
  const [university, setUniversity] = React.useState<string>("all");
  const [domain, setDomain] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = React.useState<Date | undefined>(undefined);

  // Data
  const [rows, setRows] = React.useState<AuditRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [lastDoc, setLastDoc] = React.useState<any>(null);
  const [hasMore, setHasMore] = React.useState(true);

  // Details sheet
  const [openId, setOpenId] = React.useState<string | null>(null);

  const buildQuery = React.useCallback(
    async (isNextPage = false) => {
      setLoading(true);
      try {
        const col = collection(db, "audits");
        let constraints: any[] = [];
  
        if (university !== "all") constraints.push(where("university", "==", university));
        if (domain !== "all") constraints.push(where("domain", "==", domain));
        if (dateFrom) constraints.push(where("createdAt", ">=", dateFrom));
        if (dateTo) constraints.push(where("createdAt", "<=", dateTo));
  
        // Add orderBy clauses
        if (university !== "all" || domain !== "all" || dateFrom || dateTo) {
          constraints.push(orderBy("university"));
          constraints.push(orderBy("domain"));
          constraints.push(orderBy("createdAt", "desc"));
        } else {
          constraints.push(orderBy("createdAt", "desc"));
        }
  
        if (isNextPage && lastDoc) constraints.push(startAfter(lastDoc));
        constraints.push(limit(PAGE_SIZE));
  
        const q = query(col, ...constraints);
        const snap = await getDocs(q);
  
        const docs = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as unknown as AuditRow)
        );
  
        if (isNextPage) setRows((prev) => [...prev, ...docs]);
        else setRows(docs);
  
        setLastDoc(snap.docs[snap.docs.length - 1] || null);
        setHasMore(snap.size === PAGE_SIZE);
      } catch (error: any) {
        if (error.code === 'failed-precondition') {
          console.error("Query failed. The query requires an index. Please create it in your Firebase console.", error.toString());
          // Clear the rows to indicate that the query failed
          setRows([]);
        } else {
          console.error("An error occurred while fetching the data.", error);
        }
      } finally {
        setLoading(false);
      }
    },
    [db, university, domain, dateFrom, dateTo, lastDoc]
  );

  React.useEffect(() => {
    setLastDoc(null);
    setHasMore(true);
    void buildQuery(false);
  }, [university, domain, dateFrom, dateTo, buildQuery]);

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
              <TableHead className="sticky right-0 bg-background z-10">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
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
                  <TableCell>{format(dt, "dd MMM yyyy, HH:mm")}</TableCell>
                  <TableCell>{r.status}</TableCell>
                  <TableCell>{r.c1}</TableCell>
                  <TableCell>{r.c2}</TableCell>
                  <TableCell>{r.c3}</TableCell>
                  <TableCell>{r.c4}</TableCell>
                  <TableCell>{r.c5}</TableCell>
                  <TableCell>{r.c6}</TableCell>
                  <TableCell>{r.c7}</TableCell>
                  <TableCell>{r.c8}</TableCell>
                  <TableCell>{r.c9}</TableCell>
                  <TableCell>{r.c10}</TableCell>
                  <TableCell className="font-semibold">{r.finalCqScore}</TableCell>
                  <TableCell title={r.improvementTips} className="whitespace-pre-wrap max-w-xs">{truncate(r.improvementTips, 120)}</TableCell>
                  <TableCell className="sticky right-0 bg-background z-10">
                    <Sheet
                      open={openId === r.id}
                      onOpenChange={(o) => setOpenId(o ? r.id : null)}
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
                            Diarized Transcript — {r.university} / {r.domain}
                          </SheetTitle>
                        </SheetHeader>
                        <div className="mt-4 space-y-2">
                          {r.utterances?.length ? (
                            r.utterances.map((u, idx) => (
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
                              No utterances saved.
                            </p>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => void buildQuery(true)}
          disabled={!hasMore || loading}
        >
          {hasMore ? "Load more" : "No more"}
        </Button>
      </div>
    </div>
  );
}

function truncate(s: string, n = 120) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function toTime(msOrSec: number) {
  const s = msOrSec > 1000 ? Math.floor(msOrSec / 1000) : Math.floor(msOrSec);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}
