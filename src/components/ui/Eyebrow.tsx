
import React from 'react';

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
    <div className="inline-block text-xs uppercase tracking-wider font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
      {children}
    </div>
);

export default Eyebrow;
