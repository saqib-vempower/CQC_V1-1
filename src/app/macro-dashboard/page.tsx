'use client';

import * as React from 'react';
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
} from 'firebase/firestore';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageLayout } from '@/components/ui/PageLayout';
import withAuthorization from '@/components/withAuthorization';
import { getFirebaseServices } from '@/lib/firebase-client';

// Define ScoreKey type - This was the critical missing definition
type ScoreKey = `c${1|2|3|4|5|6|7|8|9|10}`;

// Define the AuditRow type as it's used for fetching data
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

const criterionLabels: Record<ScoreKey, string> = {
  c1: "C1: Opening, Purpose & Identity",
  c2: "C2: Rapport Building",
  c3: "C3: Needs Analysis/Discovery",
  c4: "C4: Solution Presentation",
  c5: "C5: Objection Handling",
  c6: "C6: Closing/Next Steps",
  c7: "C7: Active Listening",
  c8: "C8: Communication Clarity",
  c9: "C9: Compliance Adherence",
  c10: "C10: Overall Professionalism",
};

function MacroDashboardPage() {
  const { db } = getFirebaseServices();

  // Filters
  const [university, setUniversity] = React.useState<string>('all');
  const [domain, setDomain] = React.useState<string>('all');
  const [dateFrom, setDateFrom] = React.useState<string>('');
  const [dateTo, setDateTo] = React.useState<string>('');

  // Data
  const [currentAudits, setCurrentAudits] = React.useState<AuditRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  // --- Data Aggregation (Client-side for filtered data) ---
  const totalCallsAudited = currentAudits.length;
  
  const overallAverageCQScore =
    React.useMemo(() => {
      if (currentAudits.length === 0) return 'N/A';
      const totalScore = currentAudits.reduce((sum, audit) => sum + (audit.finalCqScore || 0), 0);
      return (totalScore / currentAudits.length).toFixed(1);
    }, [currentAudits]);

  const avgScoresByUniversity = React.useMemo(() => {
    const universityData: Record<string, { totalScore: number; count: number }> = {};

    currentAudits.forEach((audit) => {
      const uni = audit.university || 'Unknown';
      if (!universityData[uni]) {
        universityData[uni] = { totalScore: 0, count: 0 };
      }
      universityData[uni].totalScore += audit.finalCqScore || 0;
      universityData[uni].count++;
    });

    return Object.entries(universityData).map(([name, data]) => ({
      name,
      totalAudits: data.count,
      avgScore: data.count > 0 ? (data.totalScore / data.count).toFixed(1) : 'N/A',
    })).sort((a, b) => parseFloat(b.avgScore as string) - parseFloat(a.avgScore as string));
  }, [currentAudits]);

  const avgScoresByAgent = React.useMemo(() => {
    const agentData: Record<string, { totalScore: number; count: number }> = {};

    currentAudits.forEach((audit) => {
      const agent = audit.agentName || 'Unknown';
      if (!agentData[agent]) {
        agentData[agent] = { totalScore: 0, count: 0 };
      }
      agentData[agent].totalScore += audit.finalCqScore || 0;
      agentData[agent].count++;
    });

    return Object.entries(agentData).map(([name, data]) => ({
      name,
      totalAudits: data.count,
      avgScore: data.count > 0 ? (data.totalScore / data.count).toFixed(1) : 'N/A',
    })).sort((a, b) => parseFloat(b.avgScore as string) - parseFloat(a.avgScore as string));
  }, [currentAudits]);

  const avgScoresByCriterion = React.useMemo(() => {
    const criterionScores: Record<ScoreKey, { total: number; count: number }> = {
      c1: { total: 0, count: 0 }, c2: { total: 0, count: 0 }, c3: { total: 0, count: 0 },
      c4: { total: 0, count: 0 }, c5: { total: 0, count: 0 }, c6: { total: 0, count: 0 },
      c7: { total: 0, count: 0 }, c8: { total: 0, count: 0 }, c9: { total: 0, count: 0 },
      c10: { total: 0, count: 0 },
    };

    currentAudits.forEach(audit => {
      (Object.keys(criterionScores) as ScoreKey[]).forEach(key => {
        const score = audit.scores?.[key];
        if (typeof score === 'number') {
          criterionScores[key].total += score; 
          criterionScores[key].count++;
        }
      });
    });

    return (Object.keys(criterionScores) as ScoreKey[]).map(key => ({
      criterion: criterionLabels[key],
      avgScore: criterionScores[key].count > 0 
        ? (criterionScores[key].total / criterionScores[key].count).toFixed(1)
        : 'N/A',
    }));
  }, [currentAudits]);


  // --- End Data Aggregation ---

  React.useEffect(() => {
    if (!db) return;
    setLoading(true);

    const col = collection(db, 'audits');
    let constraints: any[] = [];

    if (university !== 'all') constraints.push(where('university', '==', university));
    if (domain !== 'all') constraints.push(where('domain', '==', domain));
    if (dateFrom) constraints.push(where('callDate', '>=', dateFrom));
    if (dateTo) constraints.push(where('callDate', '<=', dateTo));

    constraints.push(orderBy('createdAt', 'desc')); // Always sort by createdAt

    constraints.push(limit(500)); // Increased limit for macro view, adjust as needed

    const q: Query<DocumentData> = query(col, ...constraints);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AuditRow));
      setCurrentAudits(docs);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to audits for Macro Dashboard:', error);
      if (error.code === 'failed-precondition') {
        console.error('Query failed. The query may require an index. Please check the Firestore console.');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, university, domain, dateFrom, dateTo]);

  return (
    <PageLayout centered showBackButton={true}>
      <h1 className="text-3xl font-bold mb-6">Call Quality Macro Dashboard</h1>

      <div className="space-y-4">
        {/* Filter Controls */}
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div className="grid gap-2 min-w-[180px]">
            <Label htmlFor="university-select-macro">University Name</Label>
            <Select onValueChange={setUniversity} value={university}>
              <SelectTrigger id="university-select-macro"><SelectValue placeholder="Select University" /></SelectTrigger>
              <SelectContent>{universityOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2 min-w-[180px]">
            <Label htmlFor="domain-select-macro">Call Domain</Label>
            <Select onValueChange={setDomain} value={domain}>
              <SelectTrigger id="domain-select-macro"><SelectValue placeholder="Select Domain" /></SelectTrigger>
              <SelectContent>{domainOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 min-w-[180px]">
              <Label htmlFor="date-from-macro">Start Date</Label>
              <Input
                  id="date-from-macro"
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full"
              />
          </div>
          <div className="grid gap-2 min-w-[180px]">
              <Label htmlFor="date-to-macro">End Date</Label>
              <Input
                  id="date-to-macro"
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full"
              />
          </div>
        </div>

        {/* Metrics Display Area */}
        {loading ? (
          <p className="text-center text-muted-foreground">Loading macro data...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Total Calls Audited Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Calls Audited</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{totalCallsAudited}</div>
                <p className="text-xs text-muted-foreground">
                  Calls within selected filters
                </p>
              </CardContent>
            </Card>

            {/* Overall Average Call Quality Score Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Avg. CQ Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{overallAverageCQScore} / 100</div>
                <p className="text-xs text-muted-foreground">
                  Composite score
                </p>
              </CardContent>
            </Card>

            {/* University Performance Overview Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>University Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>University Name</TableHead>
                      <TableHead>Total Audits</TableHead>
                      <TableHead>Avg. CQ Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {avgScoresByUniversity.length > 0 ? (
                      avgScoresByUniversity.map((data, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{data.name}</TableCell>
                          <TableCell>{data.totalAudits}</TableCell>
                          <TableCell>{data.avgScore}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data for universities.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Agent Performance Overview Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Agent Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Total Audits</TableHead>
                      <TableHead>Avg. CQ Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {avgScoresByAgent.length > 0 ? (
                      avgScoresByAgent.map((data, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{data.name}</TableCell>
                          <TableCell>{data.totalAudits}</TableCell>
                          <TableCell>{data.avgScore}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data for agents.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Average Score Per Criterion Card */}
            <Card className="lg:col-span-2 xl:col-span-4">
              <CardHeader>
                <CardTitle>Average Score Per Criterion (C1-C10)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Criterion</TableHead>
                      <TableHead>Avg. Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {avgScoresByCriterion.length > 0 ? (
                      avgScoresByCriterion.map((data, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{data.criterion}</TableCell>
                          <TableCell>{data.avgScore}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No criterion data available.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default withAuthorization(MacroDashboardPage, ['Admin', 'QA']);