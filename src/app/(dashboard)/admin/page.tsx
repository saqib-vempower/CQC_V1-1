import React from 'react';
import AdminDashboard from '@/components/cqc/admin-dashboard';
import { listAllCalls } from '@/lib/firestore';

export default async function AdminPage() {
  const calls = await listAllCalls();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <AdminDashboard initialCalls={calls} />
    </div>
  );
}
