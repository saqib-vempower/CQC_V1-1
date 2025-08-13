
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Compass, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

type HeaderProps = {
  user?: User | null;
}

export function Header({ user }: HeaderProps) {
  const [canViewDashboard, setCanViewDashboard] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'allowedUsers', user.email!);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userRole = userDoc.data().role;
            if (userRole === 'admin' || userRole === 'qa_reviewer') {
                setCanViewDashboard(true);
            } else {
                setCanViewDashboard(false);
            }
          } else {
            setCanViewDashboard(false);
          }
        } catch (error) {
            console.error("Failed to check user role", error);
            setCanViewDashboard(false);
        }
      } else {
        setCanViewDashboard(false);
      }
    };
    checkRole();
  }, [user]);

  const handleSignOut = async () => {
    await auth.signOut();
  };

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
                <Compass className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold tracking-tight font-headline">
                Call Quality Compass
                </h1>
            </Link>
          </div>
          {user && (
            <div className='flex items-center gap-4'>
              <span className='text-sm text-muted-foreground'>Welcome, {user.email}</span>
              {canViewDashboard && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
