
'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/cqc/auth-provider';
import { Header } from '@/components/cqc/header';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    router.push('/login');
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header user={user} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight">Welcome, {user?.email}</h1>
            <p className="text-muted-foreground mt-2">What would you like to do today?</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            <Link href="/admin">
                <Card className="hover:border-primary transition-all cursor-pointer h-full flex flex-col">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl">Dashboard</CardTitle>
                            <LayoutDashboard className="w-8 h-8 text-primary" />
                        </div>
                        <CardDescription className="pt-2 text-left">
                            View all analyzed call records, check agent performance metrics, and export data.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </Link>
            <Link href="/audits">
                 <Card className="hover:border-primary transition-all cursor-pointer h-full flex flex-col">
                    <CardHeader>
                         <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl">Start New Audit</CardTitle>
                            <ArrowRight className="w-8 h-8 text-primary" />
                        </div>
                        <CardDescription className="pt-2 text-left">
                           Upload new call recordings for automated analysis, scoring, and feedback generation.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </Link>
        </div>
      </main>
    </div>
  );
}
