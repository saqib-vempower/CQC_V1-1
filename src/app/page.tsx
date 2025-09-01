'use client';

import React from 'react';
import NavBar from '@/components/ui/NavBar';
import Hero from '@/components/ui/Hero';
import Flow from '@/components/ui/Flow';
import Scorecard from '@/components/ui/Scorecard';
import FAQ from '@/components/ui/FAQ';

export default function LandingPage() {
  const brand = {
    name: 'Call Quality Compass',
    tagline: 'Call Quality Compass',
    logo: '🧭',
    cta: { primary: { label: 'Get Started', href: '/login' } },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar brand={brand} />
      <main>
        <Hero brand={brand} />
        <Flow brand={brand} />
        <Scorecard brand={brand} />
        <FAQ />
      </main>
    </div>
  );
}