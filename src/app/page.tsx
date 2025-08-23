
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

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

const NavBar = ({ brand }) => (
  <div className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-gray-100">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <Link
        href="#home"
        className="flex items-center gap-2 font-semibold text-gray-900"
      >
        <span className="text-xl">{brand.logo}</span>
        <span>{brand.name}</span>
      </Link>
      <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
        <Link href="#flow" className="hover:text-gray-900">
          How it works
        </Link>
        <Link href="#scorecard" className="hover:text-gray-900">
          Scorecard
        </Link>
        <Link href="#faq" className="hover:text-gray-900">
          FAQ
        </Link>
      </nav>
      <div className="flex items-center gap-3">
        <Link
          href={brand.cta.primary.href}
          className={`text-sm text-white ${brand.accent} ${brand.accentHover} px-4 py-2 rounded-xl shadow-sm`}
        >
          {brand.cta.primary.label}
        </Link>
      </div>
    </div>
  </div>
);

const Hero = ({ brand }) => (
  <section id="home" className="relative overflow-hidden">
    <div
      className={`absolute inset-0 ${brand.primaryGrad} opacity-10`}
      aria-hidden="true"
    />
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeIn()}
        className="text-center"
      >
        <div className="text-6xl mb-4 inline-block">{brand.logo}</div>
        <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">
          {brand.name}
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          AI-powered call auditing tool to empower agents.
        </p>

        <div className="mt-10">
          <Link
            href={brand.cta.primary.href}
            className={`inline-flex items-center justify-center text-sm font-medium text-white ${brand.accent} ${brand.accentHover} px-5 py-3 rounded-xl shadow-md`}
          >
            {brand.cta.primary.label}
          </Link>
        </div>

        <div className="mt-10 text-xs text-gray-500">
          Built on Firebase • Gemini • AssemblyAI
        </div>
      </motion.div>
    </div>
  </section>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-block text-xs uppercase tracking-wider font-semibold text-indigo-700/90 bg-indigo-50 px-3 py-1 rounded-full mb-3">
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
    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h2>
    {subtitle && (
      <div className="mt-3 text-gray-600 leading-relaxed">{subtitle}</div>
    )}
  </div>
);

const Flow = ({ brand }) => (
  <section
    id="flow"
    className="py-16 md:py-24 bg-gradient-to-b from-white to-slate-50"
  >
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="How it works"
        title="Four simple steps"
        subtitle="Compass handles the heavy lifting. You focus on coaching and quality."
      />
      <div className="mt-10 grid md:grid-cols-4 gap-6">
        {[
          {
            n: 1,
            t: 'Upload call',
            d: 'Add MP3 + metadata (university, domain, type).',
            icon: icons.upload,
          },
          {
            n: 2,
            t: 'Transcribe',
            d: 'Diarized transcript with timestamps.',
            icon: icons.mic,
          },
          {
            n: 3,
            t: 'Compute metrics',
            d: 'Talk time, gaps, holds, overlaps.',
            icon: icons.chart,
          },
          {
            n: 4,
            t: 'Score & coach',
            d: 'Rubric scores with evidence + notes.',
            icon: icons.table,
          },
        ].map(({ n, t, d, icon }) => (
          <div key={n} className="rounded-2xl border border-gray-200 bg-white p-6">
            <div
              className={`w-10 h-10 grid place-items-center rounded-xl text-white ${brand.accent}`}
            >
              {n}
            </div>
            <div className="mt-3 flex items-center gap-2 text-gray-900 font-semibold">
              <Icon path={icon} /> {t}
            </div>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{d}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Scorecard = ({ brand }) => (
  <section id="scorecard" className="py-16 md:py-24 bg-white">
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
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="font-semibold text-gray-900">Criteria & weights</h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li>
              <span className="font-medium text-gray-800">C1</span> Opening,
              Purpose & Identity —{' '}
              <span className="text-gray-800 font-medium">10</span>
            </li>
            <li>
              <span className="font-medium text-gray-800">C2</span> Active
              Listening & Empathy —{' '}
              <span className="text-gray-800 font-medium">12</span>
            </li>
            <li>
              <span className="font-medium text-gray-800">C3</span> Clarity &
              Organization — <span className="text-gray-800 font-medium">10</span>
            </li>
            <li>
              <span className="font-medium text-gray-800">C4</span> Managing
              Holds, Pauses & Lookups —{' '}
              <span className="text-gray-800 font-medium">12</span>
            </li>
            <li>
              <span className="font-medium text-gray-800">C5</span> Probing &
              Clarification — <span className="text-gray-800 font-medium">8</span>
            </li>
            <li>
              <span className="font-medium text-gray-800">C6</span> Information
              Delivery & Handoff —{' '}
              <span className="text-gray-800 font-medium">10</span>
            </li>
            <li>
              <span className="font-medium text-gray-800">C7</span> Handling
              Student Decisions —{' '}
              <span className="text-gray-800 font-medium">12</span>
            </li>
            <li>
              <span className="font-medium text-gray-800">C8</span> Professional
              Tone & Language — <span className="text-gray-800 font-medium">8</span>
            </li>
            <li>
              <span className="font-medium text-gray-800">C9</span> Audio
              Hygiene (Agent‑side) —{' '}
              <span className="text-gray-800 font-medium">8</span>
            </li>
            <li>
              <span className="font-medium text-gray-800">C10</span> Wrap‑up,
              Next Steps & Disposition —{' '}
              <span className="text-gray-800 font-medium">10</span>
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="font-semibold text-gray-900">
            Evidence-first scoring
          </h3>
          <p className="mt-3 text-sm text-gray-600">
            Each score is backed by a snippet from the transcript, pinpointing the exact moment the criteria was met or missed. This removes subjectivity and provides concrete examples for coaching.
          </p>
        </div>
      </div>
    </div>
  </section>
);

const FAQ = () => (
  <section
    id="faq"
    className="py-16 md:py-24 bg-gradient-to-b from-white to-slate-50"
  >
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="FAQ"
        title="You might be wondering…"
        subtitle="Short, honest answers. Replace with your specifics."
      />
      <div className="mt-10 grid md:grid-cols-2 gap-6">
        {[
          {
            q: 'Does this work with Next.js?',
            a: 'Yes. It’s a React component and works with Next, Vite, CRA, etc.',
          },
          {
            q: 'Where do transcripts live?',
            a: 'In Firestore/Storage collections tied to each call; access is role‑restricted.',
          },
          {
            q: 'How is scoring explained?',
            a: 'Every deduction includes a timestamped snippet and a short coach note.',
          },
          {
            q: 'Can we export reports?',
            a: 'Yes—export summaries and details to Google Sheets for sharing and audits.',
          },
        ].map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-2xl border border-gray-200 bg-white p-6"
          >
            <summary className="cursor-pointer list-none font-medium text-gray-900 flex items-center justify-between">
              {q}
              <span className="ml-4 text-gray-500 group-open:rotate-45 transition-transform">
                <Icon path="M12 5v14M5 12h14" className="w-5 h-5" />
              </span>
            </summary>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">{a}</p>
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
    primaryGrad: 'bg-gradient-to-br from-[#3B5998] via-[#4B6FB3] to-[#7FB3FF]', // navy → light blue
    accent: 'bg-[#3B5998]',
    accentHover: 'hover:bg-[#334a80]',
    logo: '🧭',
    cta: {
      primary: { label: 'Get Started', href: '/login' },
    },
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
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
