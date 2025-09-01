
import React from 'react';

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

export default Scorecard;