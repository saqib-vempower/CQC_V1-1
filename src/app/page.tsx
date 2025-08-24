'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Canvas preview shim (in your Next.js app, keep using next/link)
// We ensure proper button semantics, focus, and keyboard activation.
const PrimaryButton = ({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <a
    href={href}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') (e.currentTarget as HTMLAnchorElement).click();
    }}
    className={`inline-flex items-center justify-center text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-[0.98] px-5 py-3 rounded-xl shadow-md transition cursor-pointer pointer-events-auto ${className}`}
  >
    {children}
  </a>
);

// tiny inline icon helper (no extra deps)
const Icon = ({ path, className = 'w-6 h-6' }: { path: string; className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={path} />
  </svg>
);

const icons = {
  bolt: 'M13 3L4 14h7l-1  7 9-11h-7l1-7z',
  shield: 'M12 3l7 4v5c0 5-3.8 9.1-7 10-3.2-.9-7-5-7-10V7l7-4z',
  wave: 'M3 12s2-4 6-4 6 4 12 4-2 4-6 4-6-4-12-4z',
  check: 'M20 6l-11 11-5-5',
  upload: 'M12 3v12M7 8l5-5 5 5M5 19h14',
  mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3z M5 11a7 7 0 0 0 14 0M12 18v3',
  table: 'M4 6h16M4 12h16M4 18h16M8 4v16M16 4v16',
  wand: 'M3 21l10-10M14 4l6 6M12 6l6 6M6 12l6 6',
  chart: 'M4 20h16M7 16v-6M12 20V8m5 12v-9',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z M14 3v6h6',
  play: 'M8 5v14l11-7-11-7z',
};

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, delay } },
});

const NavBar = ({ brand }: any) => (
  <div className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-background/90 border-b">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <a
        href="#home"
        className="flex items-center gap-2 font-semibold text-foreground"
      >
        <span className="text-xl">{brand.logo}</span>
        <span>{brand.name}</span>
      </a>
      <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
        <a href="#flow" className="hover:text-foreground">
          How it works
        </a>
        <a href="#scorecard" className="hover:text-foreground">
          Scorecard
        </a>
        <a href="#faq" className="hover:text-foreground">
          FAQ
        </a>
      </nav>
      <div className="flex items-center gap-3">
        <PrimaryButton href={brand.cta.primary.href}>
          {brand.cta.primary.label}
        </PrimaryButton>
      </div>
    </div>
  </div>
);

const Hero = ({ brand }: any) => (
  <section id="home" className="relative overflow-hidden">
    {/* Gradient overlay must not block clicks */}
    <div
      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary via-primary/70 to-secondary opacity-10"
      aria-hidden="true"
    />
    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeIn()}
        className="text-center"
      >
        <div className="text-6xl mb-4 inline-block">{brand.logo}</div>
        <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
          {brand.name}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          AI-powered call auditing tool to empower agents.
        </p>

        <div className="mt-10">
          <PrimaryButton href={brand.cta.primary.href}>
            {brand.cta.primary.label}
          </PrimaryButton>
        </div>

        <div className="mt-10 text-xs text-muted-foreground">
          Built on Firebase • Gemini • AssemblyAI
        </div>
      </motion.div>
    </div>
  </section>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-block text-xs uppercase tracking-wider font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
    {children}
  </div>
);

const SectionTitle = ({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
}) => (
  <div className="text-center max-w-2xl mx-auto">
    {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
    <h2 className="text-3xl md:text-4xl font-bold text-foreground">{title}</h2>
    {subtitle && (
      <div className="mt-3 text-muted-foreground leading-relaxed">{subtitle}</div>
    )}
  </div>
);

const Flow = ({ brand }: any) => (
  <section
    id="flow"
    className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/20"
  >
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="How it works"
        title="Four simple steps"
        subtitle="Compass handles the heavy lifting. You focus on coaching and quality."
      />
      <div className="mt-10 grid md:grid-cols-4 gap-6">
        {[
          { n: 1, t: 'Upload call', d: 'Add MP3 + metadata (university, domain, type).', icon: icons.upload },
          { n: 2, t: 'Transcribe', d: 'Diarized transcript with timestamps.', icon: icons.mic },
          { n: 3, t: 'Compute metrics', d: 'Talk time, gaps, holds, overlaps.', icon: icons.chart },
          { n: 4, t: 'Score & coach', d: 'Rubric scores with evidence + notes.', icon: icons.table },
        ].map(({ n, t, d, icon }) => (
          <div key={n} className="rounded-2xl border bg-card p-6">
            <div className="w-10 h-10 grid place-items-center rounded-xl text-primary-foreground bg-primary">
              {n}
            </div>
            <div className="mt-3 flex items-center gap-2 text-foreground font-semibold">
              <Icon path={icon} /> {t}
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Scorecard = ({ brand }: any) => (
  <section id="scorecard" className="py-16 md:py-24 bg-background">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="Scorecard v1.0"
        title="Ten Key Behavioral Criteria"
        subtitle={
          <>
            Scoring Guide: Criteria are weighted to a total of 100. <br />
            Any point deductions must be supported by evidence.
          </>
        }
      />
      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="font-semibold text-foreground">Criteria & weights</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><span className="font-medium text-foreground">C1</span> Opening, Purpose & Identity — <span className="text-foreground font-medium">10</span></li>
            <li><span className="font-medium text-foreground">C2</span> Active Listening & Empathy — <span className="text-foreground font-medium">12</span></li>
            <li><span className="font-medium text-foreground">C3</span> Clarity & Organization — <span className="text-foreground font-medium">10</span></li>
            <li><span className="font-medium text-foreground">C4</span> Managing Holds, Pauses & Lookups — <span className="text-foreground font-medium">12</span></li>
            <li><span className="font-medium text-foreground">C5</span> Probing & Clarification — <span className="text-foreground font-medium">8</span></li>
            <li><span className="font-medium text-foreground">C6</span> Information Delivery & Handoff — <span className="text-foreground font-medium">10</span></li>
            <li><span className="font-medium text-foreground">C7</span> Handling Student Decisions — <span className="text-foreground font-medium">12</span></li>
            <li><span className="font-medium text-foreground">C8</span> Professional Tone & Language — <span className="text-foreground font-medium">8</span></li>
            <li><span className="font-medium text-foreground">C9</span> Audio Hygiene (Agent‑side) — <span className="text-foreground font-medium">8</span></li>
            <li><span className="font-medium text-foreground">C10</span> Wrap‑up, Next Steps & Disposition — <span className="text-foreground font-medium">10</span></li>
          </ul>
        </div>
        <div className="rounded-2xl border bg-card p-6">
          <h3 className="font-semibold text-foreground">Evidence-first scoring</h3>
          <p className="mt-2 text-sm text-muted-foreground">Each deduction references a timestamped snippet with a short coach note.</p>
        </div>
      </div>
    </div>
  </section>
);

const FAQ = () => (
  <section id="faq" className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/20">
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="FAQ"
        title="You might be wondering…"
        subtitle="Short, honest answers. Replace with your specifics."
      />
      <div className="mt-10 grid md:grid-cols-2 gap-6">
        {[
          { q: 'Does this work with Next.js?', a: 'Yes. It’s a React component and works with Next, Vite, CRA, etc.' },
          { q: 'Where do transcripts live?', a: 'In Firestore/Storage collections tied to each call; access is role‑restricted.' },
          { q: 'How is scoring explained?', a: 'Every deduction includes a timestamped snippet and a short coach note.' },
          { q: 'Can we export reports?', a: 'Yes—export summaries and details to Google Sheets for sharing and audits.' },
        ].map(({ q, a }) => (
          <details key={q} className="group rounded-2xl border bg-card p-6">
            <summary className="cursor-pointer list-none font-medium text-foreground flex items-center justify-between">
              {q}
              <span className="ml-4 text-muted-foreground group-open:rotate-45 transition-transform">
                <Icon path="M12 5v14M5 12h14" className="w-5 h-5" />
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

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