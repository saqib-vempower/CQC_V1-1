
import React from 'react';
import Eyebrow from './Eyebrow';

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

export default SectionTitle;
