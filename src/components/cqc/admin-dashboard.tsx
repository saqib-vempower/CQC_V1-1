
'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getAllCalls, StoredCallRecord } from '@/ai/flows/get-all-calls';
import { getSignupRequests, SignupRequestRecord } from '@/ai/flows/get-signup-requests';
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
import { Button } from '../ui/button';
import { DownloadCloud, Loader2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportToSheets } from '@/ai/flows/export-to-sheets';


export function AdminDashboard() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<StoredCallRecord[]>([]);
  const [signupRequests, setSignupRequests] = useState<SignupRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [{ calls }, { requests }] = await Promise.all([
            getAllCalls(),
            getSignupRequests()
        ]);
        
        // Sort calls by date, most recent first
        const sortedCalls = calls.sort((a, b) => {
            const dateA = new Date(a.callDate);
            const dateB = new Date(b.callDate);
            return dateB.getTime() - dateA.getTime();
        });

        setCalls(sortedCalls);
        setSignupRequests(requests);
        setError(null);
      } catch (err) {
        setError('Failed to fetch dashboard data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const handleExport = async () => {
    setIsExporting(true);
    try {
        const {success, message} = await exportToSheets({records: calls});
        if (success) {
            toast({
                title: 'Export Successful',
                description: 'All records have been sent to Google Sheets.',
            });
        } else {
             throw new Error(message);
        }
    } catch (err) {
        toast({
            variant: 'destructive',
            title: 'Export Failed',
            description: err instanceof Error ? err.message : 'An unknown error occurred.',
        });
        console.error(err);
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header user={user} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid gap-8">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle>Analyzed Call Records</CardTitle>
                      <CardDescription>View all audited call records.</CardDescription>
                    </div>
                    <Button onClick={handleExport} disabled={isExporting || loading || calls.length === 0}>
                      {isExporting ? <Loader2 className="animate-spin" /> : <DownloadCloud />}
                      Export to Sheets
                    </Button>
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

            <Card>
                <CardHeader>
                    <CardTitle>Signup Requests</CardTitle>
                    <CardDescription>Users who tried to sign up but were not on the allowed list.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && <p>Loading signup requests...</p>}
                    {!loading && !error && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Attempted On</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {signupRequests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.email}</TableCell>
                                        <TableCell>{format(new Date(req.timestamp), 'PPP p')}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm">Add User</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    {!loading && signupRequests.length === 0 && (
                        <div className="text-center py-12">
                            <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">No new signup requests.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
