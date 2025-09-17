'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import withAuthorization from '@/components/withAuthorization';
import { PageLayout } from '@/components/ui/PageLayout';

function QAPage() {
  const router = useRouter();

  return (
    <PageLayout centered>
      <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">QA Portal</h1>
        <p className="text-gray-600 mb-8">Welcome, QA Team Member. Please select an option below.</p>
        <div className="space-y-4">
          <Button onClick={() => router.push('/dashboard')} className="w-full">
            Go to Dashboard
          </Button>
          <Button onClick={() => router.push('/tool')} className="w-full">
            Go to Tool
          </Button>
          {/* Wrapped Macro Dashboard Link in a div for consistent spacing */}
          <div>
            <Link href="/macro-dashboard" passHref className="w-full">
              <Button className="w-full">Go to Macro Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// Apply the security wrapper to the QAPage
export default withAuthorization(QAPage, ['QA']);
