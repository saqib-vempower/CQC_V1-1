'use client';

import { Header } from './Header';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  centered?: boolean;
}

export function PageLayout({ children, showBackButton = false, centered = false }: PageLayoutProps) {
  return (
    <div>
      <Header showBackButton={showBackButton} />
      <main className={cn(
        "p-4 sm:p-6 lg:p-8",
        centered && "flex flex-col items-center justify-center"
      )}>
        {children}
      </main>
    </div>
  );
}
