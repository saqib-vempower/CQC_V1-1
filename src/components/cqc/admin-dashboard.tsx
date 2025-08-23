'use client';
import React from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Call } from '@/lib/firestore';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboard({ initialCalls }: { initialCalls: Call[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>University</TableHead>
          <TableHead>Agent</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {initialCalls.map((call) => (
          <TableRow key={call.id}>
            <TableCell>
              {formatDistanceToNow(new Date(call.timestamp), { addSuffix: true })}
            </TableCell>
            <TableCell>{call.metadata.university}</TableCell>
            <TableCell>{call.agentId.substring(0, 8)}...</TableCell>
            <TableCell>
              <Badge variant={call.analysis.score.overall > 85 ? 'default' : 'destructive'}>
                {call.analysis.score.overall}
              </Badge>
            </TableCell>
            <TableCell>
              <Button asChild variant="outline" size="sm">
                <Link href={`/audits/${call.id}`}>View Details</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
