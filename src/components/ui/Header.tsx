'use client';

import { useAuth } from '@/context/AuthContext';
import { getFirebaseServices } from '@/lib/firebase-client';
import { signOut } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import PrimaryButton from './PrimaryButton';
import { Button } from './button';

interface HeaderProps {
  showBackButton?: boolean;
}

export function Header({ showBackButton = false }: HeaderProps) {
  const { user, userRole } = useAuth();
  const { auth } = getFirebaseServices();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleBack = () => {
    if (pathname === '/dashboard') {
      switch (userRole) {
        case 'Admin':
          router.push('/admin');
          break;
        case 'QA':
          router.push('/qa');
          break;
        case 'Agent':
          router.push('/agent');
          break;
        default:
          router.back();
          break;
      }
    } else {
      router.back();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <header className="flex justify-end p-4 gap-4">
      {showBackButton && (
        <Button onClick={handleBack} variant="outline">
          Back
        </Button>
      )}
      <PrimaryButton onClick={handleLogout}>
        Logout
      </PrimaryButton>
    </header>
  );
}
