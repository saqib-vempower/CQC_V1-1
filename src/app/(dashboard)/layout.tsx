
'use client';

import { Header } from '@/components/cqc/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Since all dashboard pages are deleted, this layout now only provides the header and a main content area.
  // The sidebar and navigation have been removed as they are no longer needed.
  return (
    <div>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
