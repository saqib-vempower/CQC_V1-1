'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import withAuthorization from '@/components/withAuthorization';

// This is mock data. We will replace this with data from Firestore later.
const mockCalls = [
  {
    id: 'CALL-001',
    user: 'Alice',
    rating: 95,
    duration: '12:34',
    date: '2023-10-26',
    status: 'Reviewed',
  },
  {
    id: 'CALL-002',
    user: 'Bob',
    rating: 82,
    duration: '08:51',
    date: '2023-10-26',
    status: 'Pending',
  },
  {
    id: 'CALL-003',
    user: 'Charlie',
    rating: 88,
    duration: '15:12',
    date: '2023-10-25',
    status: 'Reviewed',
  },
    {
    id: 'CALL-004',
    user: 'David',
    rating: 76,
    duration: '05:22',
    date: '2023-10-25',
    status: 'Requires Follow-up',
  },
  {
    id: 'CALL-005',
    user: 'Eve',
    rating: 91,
    duration: '11:01',
    date: '2023-10-24',
    status: 'Reviewed',
  },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'Reviewed':
      return 'default';
    case 'Pending':
      return 'secondary';
    case 'Requires Follow-up':
      return 'destructive';
    default:
      return 'outline';
  }
};

function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Call Dashboard</CardTitle>
            <CardDescription>
              A list of recent calls for review and analysis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-medium">{call.id}</TableCell>
                    <TableCell>{call.user}</TableCell>
                    <TableCell className="text-center">{call.rating}</TableCell>
                    <TableCell>{call.duration}</TableCell>
                    <TableCell>{call.date}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusBadgeVariant(call.status)}>
                        {call.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Apply the security wrapper to the DashboardPage
export default withAuthorization(DashboardPage, ['Admin', 'QA', 'Agent']);
