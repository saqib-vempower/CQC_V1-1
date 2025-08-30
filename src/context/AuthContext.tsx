'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, getIdTokenResult, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

// Define the shape of the context data
interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

// Create the provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This effect should run only once on mount to handle the email link sign-in.
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .catch((err) => {
            console.error('Error signing in with email link:', err);
            // Optionally, show an error to the user
          })
          .finally(() => {
            window.localStorage.removeItem('emailForSignIn');
          });
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const tokenResult = await getIdTokenResult(currentUser);
        const role = tokenResult.claims.role || null;
        setUserRole(role as string | null);
      } else {
        // User is signed out
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = { user, userRole, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a custom hook for easy consumption of the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
