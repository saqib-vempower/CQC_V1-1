
import React from 'react';
import Icon from './Icon';
import SectionTitle from './SectionTitle';

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

export default FAQ;
