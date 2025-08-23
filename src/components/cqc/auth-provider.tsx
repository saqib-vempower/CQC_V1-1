
'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Splash } from './splash';
import { usePathname, useRouter } from 'next/navigation';

interface UserProfile {
  uid: string;
  email: string | null;
  role: 'Admin' | 'QA' | 'Agent';
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

const PUBLIC_PAGES = ['/'];
const AUTH_PAGES = ['/login'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
        setUser(user);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = AUTH_PAGES.includes(pathname);
    const isPublicPage = PUBLIC_PAGES.includes(pathname);

    // If user is not logged in and not on a public/auth page, redirect to login
    if (!user && !isAuthPage && !isPublicPage) {
      router.push('/login');
    } 
    // If user is logged in and on the login page, redirect to landing page
    else if (user && isAuthPage) {
        router.push('/');
    }
  }, [user, userProfile, loading, pathname, router]);

  if (loading || (!user && !AUTH_PAGES.includes(pathname) && !PUBLIC_PAGES.includes(pathname))) {
    return <Splash />;
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
