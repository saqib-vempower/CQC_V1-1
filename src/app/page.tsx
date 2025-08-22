'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/cqc/auth-provider';
import { Splash } from '@/components/cqc/splash';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/home');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return <Splash />;
}
