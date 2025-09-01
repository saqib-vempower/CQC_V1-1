
import React from 'react';
import Icon, { icons } from './Icon';
import SectionTitle from './SectionTitle';

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

export default Flow;
