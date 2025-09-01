'use client';

import AuditsDashboard from "@/components/audits/AuditsDashboard";
import { PageLayout } from "@/components/ui/PageLayout";

export default function Page() {
  return (
    <PageLayout showBackButton={true}>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Call Quality Dashboard</h1>
        <AuditsDashboard />
      </div>
    </PageLayout>
  );
}
