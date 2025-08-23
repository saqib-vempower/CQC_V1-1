import { getCall } from '@/lib/firestore';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';

function formatSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export default async function AuditResultPage({ params }: { params: { id: string } }) {
  const call = await getCall(params.id);

  if (!call) {
    return <div>Call not found</div>;
  }

  const metricsData = [
    { name: 'Talk Time', Agent: call.analysis.talkTime.agent, Prospect: call.analysis.talkTime.prospect },
    { name: 'Silence', value: call.analysis.silence.total },
    { name: 'Overlap', value: call.analysis.overlap.total },
  ];
  
  const talkTimeData = [
    { name: 'Talk Time', Agent: call.analysis.talkTime.agent, Prospect: call.analysis.talkTime.prospect },
  ]
  
  const interactionData = [
      { name: 'Silence', time: call.analysis.silence.total },
      { name: 'Overlap', time: call.analysis.overlap.total },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Call Summary</CardTitle>
          <CardDescription>
            Audit for call on {format(new Date(call.timestamp), 'PPP')}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div><span className="font-semibold">University:</span> {call.metadata.university}</div>
          <div><span className="font-semibold">Domain:</span> {call.metadata.domain}</div>
          <div><span className="font-semibold">Call Type:</span> {call.metadata.callType}</div>
          <div><span className="font-semibold">Agent:</span> {call.agentId}</div>
          <div><span className="font-semibold">Overall Score:</span> <Badge>{call.analysis.score.overall}/100</Badge></div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
          <Card>
              <CardHeader>
                  <CardTitle>Talk Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={talkTimeData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tickFormatter={formatSeconds} />
                          <YAxis type="category" dataKey="name" width={80} />
                          <Tooltip formatter={formatSeconds} />
                          <Legend />
                          <Bar dataKey="Agent" stackId="a" fill="#8884d8" />
                          <Bar dataKey="Prospect" stackId="a" fill="#82ca9d" />
                      </BarChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>
          <Card>
              <CardHeader>
                  <CardTitle>Interaction Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                   <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={interactionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={formatSeconds}/>
                          <Tooltip formatter={formatSeconds} />
                          <Legend />
                          <Bar dataKey="time" fill="#ffc658" />
                      </BarChart>
                  </ResponsiveContainer>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {call.analysis.score.criteria.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between items-center">
                <p className="font-semibold">{item.criterion}</p>
                <Badge variant={item.score === item.maxScore ? "default" : "destructive"}>{item.score}/{item.maxScore}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{item.reasoning}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Full Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
          {call.analysis.transcript.map((item, index) => (
            <div key={index} className={`flex ${item.speaker === 'A' ? 'justify-start' : 'justify-end'}`}>
                <div className={`p-3 rounded-lg max-w-[75%] ${item.speaker === 'A' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                    <p className="text-sm">{item.text}</p>
                    <p className="text-xs text-right mt-1 opacity-70">{formatSeconds(item.start)}</p>
                </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
