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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getFirebaseServices } from "@/lib/firebase-client";

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

export default function AuditsDashboard() {
  const { db } = getFirebaseServices();

  // Filters
  const [university, setUniversity] = React.useState<string>("all");
  const [domain, setDomain] = React.useState<string>("all");
  const [dateFrom, setDateFrom] = React.useState<Date | null>(null);
  const [dateTo, setDateTo] = React.useState<Date | null>(null);

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
        const constraints: any[] = [orderBy("createdAt", "desc")];

        if (university !== "all") constraints.push(where("university", "==", university));
        if (domain !== "all") constraints.push(where("domain", "==", domain));
        if (dateFrom) constraints.push(where("createdAt", ">=", new Date(dateFrom)));
        if (dateTo) constraints.push(where("createdAt", "<=", new Date(dateTo)));
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
      } finally {
        setLoading(false);
      }
    },
    [db, university, domain, dateFrom, dateTo, lastDoc]
  );

  React.useEffect(() => {
    // refetch on filter change (reset pagination)
    setLastDoc(null);
    setHasMore(true);
    void buildQuery(false);
  }, [university, domain, dateFrom, dateTo, buildQuery]);

  const openRow = React.useMemo(
    () => rows.find((r) => r.id === openId) || null,
    [rows, openId]
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
        <div className="lg:col-span-2">
          <label className="text-sm font-medium">University</label>
          <Select value={university} onValueChange={setUniversity}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="CUA">CUA</SelectItem>
              <SelectItem value="RIT">RIT</SelectItem>
              {/* TODO: Populate from a universities collection */}
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-1">
          <label className="text-sm font-medium">Domain</label>
          <Select value={domain} onValueChange={setDomain}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Support">Support</SelectItem>
              <SelectItem value="Reach">Reach</SelectItem>
              <SelectItem value="Connect">Connect</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="lg:col-span-1">
          <label className="text-sm font-medium block">From</label>
          <button
            className={cn(
              "w-full border rounded-md h-9 px-3 text-left flex items-center gap-2"
            )}
            onClick={() => {
              const d = prompt("Enter From date (YYYY-MM-DD)");
              if (d) setDateFrom(new Date(`${d}T00:00:00`));
            }}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>{dateFrom ? format(dateFrom, "dd MMM yyyy") : "Any"}</span>
          </button>
        </div>

        <div className="lg:col-span-1">
          <label className="text-sm font-medium block">To</label>
          <button
            className={cn(
              "w-full border rounded-md h-9 px-3 text-left flex items-center gap-2"
            )}
            onClick={() => {
              const d = prompt("Enter To date (YYYY-MM-DD)");
              if (d) setDateTo(new Date(`${d}T23:59:59`));
            }}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>{dateTo ? format(dateTo, "dd MMM yyyy") : "Any"}</span>
          </button>
        </div>

        <div className="lg:col-span-1 flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setUniversity("all");
              setDomain("all");
              setDateFrom(null);
              setDateTo(null);
            }}
          >
            Reset
          </Button>
          <Button onClick={() => void buildQuery(false)} disabled={loading}>
            Apply
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="whitespace-nowrap">
              <TableHead className="min-w-[140px] sticky left-0 bg-background z-10">
                University
              </TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              {/* C1..C10 */}
              <TableHead>C1</TableHead>
              <TableHead>C2</TableHead>
              <TableHead>C3</TableHead>
              <TableHead>C4</TableHead>
              <TableHead>C5</TableHead>
              <TableHead>C6</TableHead>
              <TableHead>C7</TableHead>
              <TableHead>C8</TableHead>
              <TableHead>C9</TableHead>
              <TableHead>C10</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="min-w-[240px]">Summary</TableHead>
              <TableHead className="min-w-[240px]">Improvement Tip</TableHead>
              <TableHead className="sticky right-0 bg-background z-10">
                Details
              </TableHead>
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
                  <TableCell className="sticky left-0 bg-background z-10">
                    {r.university}
                  </TableCell>
                  <TableCell>{r.domain}</TableCell>
                  <TableCell>{format(dt, "dd MMM yyyy, HH:mm")}</TableCell>
                  <TableCell>{r.status}</TableCell>

                  {/* scores */}
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

                  <TableCell className="font-semibold">
                    {r.finalCqScore}
                  </TableCell>
                  <TableCell title={r.summary}>
                    {truncate(r.summary, 120)}
                  </TableCell>
                  <TableCell title={r.improvementTips}>
                    {truncate(r.improvementTips, 120)}
                  </TableCell>

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
  // If AssemblyAI gives seconds, adjust accordingly
  const s = msOrSec > 1000 ? Math.floor(msOrSec / 1000) : Math.floor(msOrSec);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}
