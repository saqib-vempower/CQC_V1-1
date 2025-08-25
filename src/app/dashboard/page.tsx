'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import withAuthorization from '@/components/withAuthorization';
import { useAuth } from '@/context/AuthContext';

// Mock data representing the structure of the call audit results
const mockAuditData = [
  {
    agentName: 'John Doe',
    applicantId: 'APP12345',
    university: 'CUA',
    domain: 'Support',
    callType: 'Inbound',
    date: '2023-10-27',
    c1: 8, c2: 9, c3: 7, c4: 10, c5: 8, c6: 9, c7: 8, c8: 7, c9: 9, c10: 10,
    finalCqScore: 85,
    summary: 'Agent effectively resolved the applicant\'s query about financial aid.',
    improvementTips: 'Could be more proactive in offering additional resources.',
    transcript: 'Hello, thank you for calling... [full transcript]',
  },
  {
    agentName: 'Jane Smith',
    applicantId: 'APP67890',
    university: 'RIT',
    domain: 'Reach',
    callType: 'Outbound',
    date: '2023-10-26',
    c1: 7, c2: 8, c3: 8, c4: 9, c5: 7, c6: 8, c7: 9, c8: 8, c9: 7, c10: 9,
    finalCqScore: 80,
    summary: 'Agent successfully scheduled a campus tour with the applicant.',
    improvementTips: '',
    transcript: 'Hi, I am calling from... [full transcript]',
  },
  {
    agentName: 'Peter Jones',
    applicantId: 'APP10112',
    university: 'IIT',
    domain: 'Connect',
    callType: 'Inbound',
    date: '2023-10-25',
    c1: 6, c2: 7, c3: 6, c4: 8, c5: 7, c6: 6, c7: 7, c8: 8, c9: 6, c10: 7,
    finalCqScore: 68,
    summary: 'Agent struggled to answer technical questions about the engineering program.',
    improvementTips: 'Review the updated curriculum details for the College of Engineering.',
    transcript: 'Thanks for your call... [full transcript]',
  }
];

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

  // State for filters will be used later for functionality
  const [university, setUniversity] = useState('ALL');
  const [domain, setDomain] = useState('ALL');
  const [callType, setCallType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleBack = () => {
    let path = '/'; // Default path
    switch (userRole) {
      case 'Admin':
        path = '/admin';
        break;
      case 'QA':
        path = '/qa';
        break;
      case 'Agent':
        path = '/agent';
        break;
      default:
        path = '/';
        break;
    }
    router.push(path);
  };

  // In a real app, you'd filter `mockAuditData` based on the state above
  const filteredData = mockAuditData;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-full">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Call Audit Dashboard</CardTitle>
              <Button variant="outline" onClick={handleBack}>Back</Button>
            </div>
            <CardDescription>
              Review and analyze call audit results. Use the filters to narrow down the data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="grid gap-2">
                <Label>University</Label>
                <Select onValueChange={setUniversity} value={university}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {universityOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Domain</Label>
                <Select onValueChange={setDomain} value={domain}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {domainOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Call Type</Label>
                <Select onValueChange={setCallType} value={callType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {callTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent Name</TableHead>
                    <TableHead>Applicant ID</TableHead>
                    {[...Array(10)].map((_, i) => <TableHead key={`c${i+1}`}>C{i+1}</TableHead>)}
                    <TableHead>Final CQ Score</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Improvement Tips</TableHead>
                    <TableHead>Transcript</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((call) => (
                    <TableRow key={call.applicantId}>
                      <TableCell className="font-medium">{call.agentName}</TableCell>
                      <TableCell>{call.applicantId}</TableCell>
                      {[...Array(10)].map((_, i) => <TableCell key={`c${i+1}-val`}>{call[`c${i+1}` as keyof typeof call]}</TableCell>)}
                      <TableCell className="font-bold">{call.finalCqScore}</TableCell>
                      <TableCell className="max-w-xs truncate">{call.summary}</TableCell>
                      <TableCell className="max-w-xs truncate">{call.improvementTips || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{call.transcript}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default withAuthorization(DashboardPage, ['Admin', 'QA', 'Agent']);
