'use client';

import { useAuth } from '@/components/cqc/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {userProfile?.role || 'User'}!</h1>
        <p className="text-muted-foreground">Here's a quick overview of your available actions.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {userProfile?.role && ['Admin', 'QA'].includes(userProfile.role) && (
             <Card>
                <CardHeader>
                    <CardTitle>Start a New Audit</CardTitle>
                    <CardDescription>Upload a call recording to be transcribed, scored, and analyzed for quality assurance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/audits">Go to Audit Page <ArrowRight className="ml-2" /></Link>
                    </Button>
                </CardContent>
            </Card>
        )}
        {userProfile?.role === 'Admin' && (
            <Card>
                <CardHeader>
                    <CardTitle>Admin Dashboard</CardTitle>
                    <CardDescription>View all analyzed call records, track team performance, and manage the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/admin">Go to Admin Dashboard <ArrowRight className="ml-2" /></Link>
                    </Button>
                </CardContent>
            </Card>
        )}
         {userProfile?.role === 'QA' && (
            <Card>
                <CardHeader>
                    <CardTitle>QA Dashboard</CardTitle>
                    <CardDescription>Review calls assigned to you, see your past evaluations, and track agent progress.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/qa">Go to QA Dashboard <ArrowRight className="ml-2" /></Link>
                    </Button>
                </CardContent>
            </Card>
        )}
        {userProfile?.role === 'Agent' && (
            <Card>
                <CardHeader>
                    <CardTitle>Agent Performance</CardTitle>
                    <CardDescription>Check your recent call scores, review feedback, and see coaching tips to improve.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/agent">Go to Agent View <ArrowRight className="ml-2" /></Link>
                    </Button>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
