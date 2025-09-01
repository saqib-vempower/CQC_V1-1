
import React from 'react';

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

export default PrimaryButton;