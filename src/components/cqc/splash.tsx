'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Header } from './header';
import { Compass } from 'lucide-react';

export function Splash() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center text-center p-4">
        <Compass className="w-24 h-24 text-primary mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
          Welcome to Call Quality Compass
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Your AI-powered solution for analyzing call recordings, providing objective feedback, and generating actionable coaching tips to elevate your team's performance.
        </p>
        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </main>
       <footer className="text-center p-4 text-muted-foreground text-sm">
        <p>Powered by AI</p>
      </footer>
    </div>
  );
}
