'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Utterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

interface Metrics {
  talkTime: { agent: number; applicant: number };
  responseGaps: number;
  holds: number;
  overlaps: number;
  politeClarifications: number;
  namePronunciationAsked: boolean;
}

interface Criterion {
  criterion: string;
  score: number | 'N/A';
  weight: number;
  evidence: string;
  timestamp: number;
  notes: string;
}

interface Score {
  rubricVersion: string;
  overallScore: number;
  criteria: Criterion[];
}

interface CallData {
  fileName: string;
  status: string;
  university: string;
  domain: string;
  callType: string;
}

export default function AuditResultsPage() {
  const { id } = useParams();
  const [callData, setCallData] = useState<CallData | null>(null);
  const [transcript, setTranscript] = useState<Utterance[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof id !== 'string') return;

    const fetchData = async () => {
      try {
        const callDocRef = doc(db, 'calls', id);
        const callDocSnap = await getDoc(callDocRef);

        if (callDocSnap.exists()) {
          setCallData(callDocSnap.data() as CallData);
        }

        const transcriptDocRef = doc(db, 'calls', id, 'transcript', 'data');
        const transcriptDocSnap = await getDoc(transcriptDocRef);
        if (transcriptDocSnap.exists()) {
          setTranscript(transcriptDocSnap.data().utterances);
        }

        const metricsDocRef = doc(db, 'calls', id, 'metrics', 'data');
        const metricsDocSnap = await getDoc(metricsDocRef);
        if (metricsDocSnap.exists()) {
          setMetrics(metricsDocSnap.data() as Metrics);
        }
        
        const scoreDocRef = doc(db, 'calls', id, 'score', 'data');
        const scoreDocSnap = await getDoc(scoreDocRef);
        if (scoreDocSnap.exists()) {
          setScore(scoreDocSnap.data() as Score);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!callData) {
    return <div>Call not found.</div>;
  }

  const formatTimestamp = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{callData.fileName}</h1>
          <p className="text-muted-foreground">
            {callData.university} | {callData.domain} | {callData.callType}
          </p>
        </div>
        <Badge>{callData.status}</Badge>
      </div>

      {score && (
          <Card>
              <CardHeader>
                  <CardTitle>Overall Score</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                  <span className="text-4xl font-bold">{score.overallScore.toFixed(2)}</span>
                  <Progress value={score.overallScore} max={5} className="w-1/2" />
              </CardContent>
          </Card>
      )}

      <Tabs defaultValue="score">
        <TabsList>
          <TabsTrigger value="score">Score</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="score" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Scorecard</CardTitle>
                </CardHeader>
                <CardContent>
                    {score ? (
                         <Table>
                         <TableHeader>
                           <TableRow>
                             <TableHead>Criterion</TableHead>
                             <TableHead>Score</TableHead>
                             <TableHead>Weight</TableHead>
                             <TableHead>Evidence</TableHead>
                             <TableHead>Notes</TableHead>
                           </TableRow>
                         </TableHeader>
                         <TableBody>
                           {score.criteria.map((c, index) => (
                             <TableRow key={index}>
                               <TableCell>{c.criterion}</TableCell>
                               <TableCell>{c.score}</TableCell>
                               <TableCell>{c.weight}%</TableCell>
                               <TableCell>
                                 <blockquote className="pl-2 border-l-4 border-primary">
                                    "{c.evidence}" ({formatTimestamp(c.timestamp)})
                                 </blockquote>
                                </TableCell>
                               <TableCell>{c.notes}</TableCell>
                             </TableRow>
                           ))}
                         </TableBody>
                       </Table>
                    ) : (
                        <p>No score available yet.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="transcript" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Transcript</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transcript.map((utterance, index) => (
                <div key={index} className={`flex ${utterance.speaker === 'A' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-lg ${utterance.speaker === 'A' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="font-bold">{utterance.speaker === 'A' ? 'Agent' : 'Applicant'} ({formatTimestamp(utterance.start)})</p>
                    <p>{utterance.text}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Objective Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics ? (
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>Agent Talk Time</TableCell>
                      <TableCell>{metrics.talkTime.agent.toFixed(2)}s</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Applicant Talk Time</TableCell>
                      <TableCell>{metrics.talkTime.applicant.toFixed(2)}s</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Response Gaps (&gt;2s)</TableCell>
                      <TableCell>{metrics.responseGaps}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Overlaps</TableCell>
                      <TableCell>{metrics.overlaps}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Polite Clarifications</TableCell>
                      <TableCell>{metrics.politeClarifications}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Asked for Name Pronunciation</TableCell>
                      <TableCell>{metrics.namePronunciationAsked ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <p>No metrics available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
