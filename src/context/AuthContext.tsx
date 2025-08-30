'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, getIdTokenResult } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getFirebaseServices } from '@/lib/firebase-client';

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
    const { auth, db } = getFirebaseServices();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const tokenResult = await getIdTokenResult(currentUser, true);
          const role = tokenResult.claims.role || null;
          setUserRole(role as string | null);
        } else {
          setUserRole(null);
        }
        
        onSnapshot(userDocRef, async (doc) => {
          if (doc.exists() && doc.data().claimsUpdatedAt) {
            const refreshedTokenResult = await getIdTokenResult(currentUser, true);
            const newRole = refreshedTokenResult.claims.role || null;
            setUserRole(newRole as string | null);
          }
        });

      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

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
