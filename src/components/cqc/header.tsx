
'use client';

import Link from 'next/link';
import { Compass, Home, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const homePath = '/';

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={homePath} className="flex items-center gap-2">
                <Compass className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold tracking-tight font-headline">
                Call Quality Compass
                </h1>
            </Link>
          </div>
          <div className='flex items-center gap-4'>
            <Button variant="outline" size="sm" asChild>
                <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
                </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
                <Link href="/admin">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Dashboard
                </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
