
'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getAllCalls, StoredCallRecord } from '@/ai/flows/get-all-calls';
import { useAuth } from '@/components/cqc/auth-provider';
import { Header } from '@/components/cqc/header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AdminDashboard() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<StoredCallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        setLoading(true);
        const { calls } = await getAllCalls();
        
        // Sort calls by date, most recent first
        const sortedCalls = calls.sort((a, b) => {
            const dateA = new Date(a.callDate);
            const dateB = new Date(b.callDate);
            return dateB.getTime() - dateA.getTime();
        });

        setCalls(sortedCalls);
        setError(null);
      } catch (err) {
        setError('Failed to fetch call records. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header user={user} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <Card>
          <CardHeader>
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Admin Dashboard</CardTitle>
                  <CardDescription>View all analyzed call records.</CardDescription>
                </div>
              </div>
          </CardHeader>
          <CardContent>
            {loading && <p>Loading call records...</p>}
            {error && <p className="text-destructive">{error}</p>}
            {!loading && !error && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Call Date</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead className="text-right">Opening</TableHead>
                    <TableHead className="text-right">Listening</TableHead>
                    <TableHead className="text-right">Problem Solving</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>
                          <div>{call.agentName}</div>
                          <div className="text-xs text-muted-foreground">{call.applicantId}</div>
                      </TableCell>
                      <TableCell>{call.universityName}</TableCell>
                      <TableCell>{call.domain}</TableCell>
                      <TableCell>{format(new Date(call.callDate), 'PP')}</TableCell>
                      <TableCell>
                        <Badge 
                            variant={
                                call.sentiment === 'POSITIVE' ? 'default' : 
                                call.sentiment === 'NEGATIVE' ? 'destructive' : 
                                'secondary'
                            }
                            className={
                                call.sentiment === 'POSITIVE' ? 'bg-green-600 hover:bg-green-700' : ''
                            }
                        >
                            {call.sentiment}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{call.rubricScores['Opening']}</TableCell>
                      <TableCell className="text-right">{call.rubricScores['Active Listening']}</TableCell>
                      <TableCell className="text-right">{call.rubricScores['Problem Solving']}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
             {!loading && calls.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No call records found.</p>
                </div>
             )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
