// app/dashboard/page.tsx
import AuditsDashboard from "@/components/audits/AuditsDashboard";

export default function Page() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Call Quality Dashboard</h1>
      <AuditsDashboard />
    </div>
  );
}
