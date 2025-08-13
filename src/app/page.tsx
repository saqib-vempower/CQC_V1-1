'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Dashboard } from '@/components/cqc/dashboard';
import { Splash } from '@/components/cqc/splash';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        // Optionally, redirect to login page if not authenticated.
        // For this setup, we will show the splash screen which has login/signup buttons.
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>; // Or a proper skeleton loader
  }

  return user ? <Dashboard user={user} /> : <Splash />;
}
