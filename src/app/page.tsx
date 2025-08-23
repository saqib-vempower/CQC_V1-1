'use client';

import React from 'react';
import { motion } from 'framer-motion';

// ──────────────────────────────────────────────────────────────
// Brand knobs — tweak here
// ──────────────────────────────────────────────────────────────
const brand = {
  name: 'Call Quality Compass',
  tagline: 'Call Quality Compass',
  primaryGrad: 'bg-gradient-to-br from-[#3B5998] via-[#4B6FB3] to-[#7FB3FF]', // navy → light blue
  accent: 'bg-[#3B5998]',
  accentHover: 'hover:bg-[#334a80]',
  logo: '🧭',
  cta: {
    primary: { label: 'Get Started', href: '/login' },
    login: { label: 'Login', href: '/login' },
  },
};

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

const NavBar = () => (
  <div className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-gray-100">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <a
        href="#home"
        className="flex items-center gap-2 font-semibold text-gray-900"
      >
        <span className="text-xl">{brand.logo}</span>
        <span>{brand.name}</span>
      </a>
      <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
        <a href="#features" className="hover:text-gray-900">
          Features
        </a>
        <a href="#flow" className="hover:text-gray-900">
          How it works
        </a>
        <a href="#scorecard" className="hover:text-gray-900">
          Scorecard
        </a>
        <a href="#security" className="hover:text-gray-900">
          Security
        </a>
        <a href="#faq" className="hover:text-gray-900">
          FAQ
        </a>
      </nav>
      <div className="flex items-center gap-3">
        <a
          href={brand.cta.login.href}
          className="text-sm text-gray-700 hover:text-gray-900"
        >
          {brand.cta.login.label}
        </a>
        <a
          href={brand.cta.primary.href}
          className={`text-sm text-white ${brand.accent} ${brand.accentHover} px-4 py-2 rounded-xl shadow-sm`}
        >
          {brand.cta.primary.label}
        </a>
      </div>
    </div>
  </div>
);

const Hero = () => (
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
          {brand.tagline}
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Audit calls consistently with timestamped evidence, objective metrics,
          and a transparent 10‑criterion rubric.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a
            href={brand.cta.primary.href}
            className={`inline-flex items-center gap-2 ${brand.accent} ${brand.accentHover} text-white px-5 py-3 rounded-xl shadow-md`}
          >
            <Icon path={icons.check} className="w-5 h-5" />{' '}
            {brand.cta.primary.label}
          </a>
        </div>
        
        <div className="mt-10 text-xs text-gray-500">
          Built on Firebase • Gemini • optional AssemblyAI
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
  subtitle?: string;
}) => (
  <div className="text-center max-w-2xl mx-auto">
    {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h2>
    {subtitle && (
      <p className="mt-3 text-gray-600 leading-relaxed">{subtitle}</p>
    )}
  </div>
);

const FeatureCard = ({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) => (
  <motion.div
    variants={fadeIn()}
    className="group h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-center gap-3">
      <div className="rounded-xl p-2 bg-gray-50 text-gray-800">
        <Icon path={icon} />
      </div>
      <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
    </div>
    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{desc}</p>
  </motion.div>
);

const Features = () => (
  <section id="features" className="py-16 md:py-24 bg-white">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="Why Compass?"
        title="Consistent, explainable QA at scale"
        subtitle="Built for admissions teams: objective metrics, fair scoring, and export‑ready reports."
      />
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-100px' }}
        className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <FeatureCard
          icon={icons.upload}
          title="Upload & auto‑process"
          desc="Drag MP3s, validate file naming, and watch status chips progress from Uploaded → Transcribing → Scored."
        />
        <FeatureCard
          icon={icons.mic}
          title="Diarized transcripts"
          desc="Speaker‑separated text with timestamps; highlight evidence directly in context."
        />
        <FeatureCard
          icon={icons.table}
          title="10‑criterion rubric"
          desc="Weighted 0‑5 scoring with per‑criterion evidence, notes, and N/A rescaling."
        />
        <FeatureCard
          icon={icons.chart}
          title="Objective metrics"
          desc="Talk time, gaps, holds, overlaps, polite clarifications, name‑pronunciation, audio hygiene."
        />
        <FeatureCard
          icon={icons.file}
          title="Sheets export"
          desc="One‑click Google Sheets summaries and detailed tabs for coaching reviews."
        />
        <FeatureCard
          icon={icons.shield}
          title="Role‑based & secure"
          desc="Admin/QA/Agent roles, least‑privilege Firestore rules, App Check with reCAPTCHA Enterprise."
        />
      </motion.div>
    </div>
  </section>
);

const Flow = () => (
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

const Scorecard = () => (
  <section id="scorecard" className="py-16 md:py-24 bg-white">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="Scorecard v1.0"
        title="Ten behavioral criteria"
        subtitle="Weights sum to 100. Scores are 0–5 with evidence for any deduction."
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
          <p className="mt-4 text-xs text-gray-500">
            If any criterion is N/A, totals rescale to 100.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h3 className="font-semibold text-gray-900">
            Evidence‑first scoring
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" /> Each
              deduction (
              <span className="font-medium text-gray-800">&lt;5</span>)
              includes a timestamped snippet.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />{' '}
              Fairness: ignore student‑side noise; cap polite clarifications.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Coach notes
              summarize what to improve next time.
            </li>
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="text-xs text-gray-500">C4 • Holds</div>
              <div className="font-semibold text-gray-900">4/5</div>
              <div className="text-xs text-gray-500">
                Evidence @ 06:12 “One moment…”
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="text-xs text-gray-500">C2 • Empathy</div>
              <div className="font-semibold text-gray-900">3/5</div>
              <div className="text-xs text-gray-500">
                Missed reflection @ 03:48
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Security = () => (
  <section
    id="security"
    className="py-16 md:py-24 bg-gradient-to-t from-white to-slate-50"
  >
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="Security"
        title="Privacy‑first by design"
        subtitle="Built on Firebase with least‑privilege access, App Check, and PII‑aware workflows."
      />
      <div className="mt-10 grid md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <Icon path={icons.shield} /> Role‑based access
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Admin, QA, and Agent roles enforced in Firestore rules and custom
            claims.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <Icon path={icons.file} /> App Check
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Protects backends using reCAPTCHA Enterprise; helps block abuse and
            spoofed clients.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            <Icon path={icons.wave} /> Reliability & speed
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Pipeline tuned for ≤15‑minute calls in ~15 minutes p95; robust
            retries and logging.
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
      <div id="get-started" className="mt-12 text-center">
        <a
          href="/login"
          className={`inline-flex items-center gap-2 ${brand.accent} ${brand.accentHover} text-white px-6 py-3 rounded-xl shadow-md`}
        >
          <Icon path={icons.check} className="w-5 h-5" /> Create your account
        </a>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t border-gray-100 bg-white">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center md:justify-between gap-4">
      <div className="flex items-center gap-2 text-gray-700">
        <span className="text-lg">{brand.logo}</span>
        <span className="font-medium">{brand.name}</span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-500 text-sm">
          Built on Firebase • Gemini
        </span>
      </div>
      <div className="text-sm text-gray-600 flex items-center gap-4">
        <a href="#" className="hover:text-gray-900">
          Terms
        </a>
        <a href="#" className="hover:text-gray-900">
          Privacy
        </a>
        <a href="#" className="hover:text-gray-900">
          Contact
        </a>
      </div>
    </div>
  </footer>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <NavBar />
      <main>
        <Hero />
        <Features />
        <Flow />
        <Scorecard />
        <Security />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
