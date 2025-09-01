'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import withAuthorization from '@/components/withAuthorization';
import { PageLayout } from '@/components/ui/PageLayout';


function AdminPage() {
  const router = useRouter();

  return (
    <PageLayout centered>
      <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Portal</h1>
        <p className="text-gray-600 mb-8">Welcome, Admin. Please select an option below.</p>
        <div className="space-y-4">
          <Button onClick={() => router.push('/dashboard')} className="w-full">
            Go to Dashboard
          </Button>
          <Button onClick={() => router.push('/tool')} className="w-full">
            Go to Tool
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}

// Apply the security wrapper to the AdminPage
export default withAuthorization(AdminPage, ['Admin']);
