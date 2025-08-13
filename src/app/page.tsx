
'use client';
import { useEffect } from 'react';
import { useAuth } from '@/components/cqc/auth-provider';
import { useRouter } from 'next/navigation';
import { Splash } from '@/components/cqc/splash';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/home');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <div className="flex-grow flex items-center justify-center">
                <p>Loading...</p>
            </div>
        </div>
    )
  }

  if (user) {
      // Still loading or redirecting
      return (
        <div className="flex flex-col min-h-screen bg-background">
            <div className="flex-grow flex items-center justify-center">
                <p>Redirecting...</p>
            </div>
        </div>
    )
  }

  return <Splash />;
}
